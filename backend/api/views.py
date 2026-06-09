import secrets
import threading
from datetime import timedelta
from smtplib import SMTPAuthenticationError

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import EmailMessage
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPChallenge
from .serializers import (
    GoogleTokenSerializer,
    LoginEmailRequestSerializer,
    OTPChallengeResponseSerializer,
    RegisterStartSerializer,
    UserSerializer,
    VerifyCodeSerializer,
)
from .services.google_auth_service import verify_google_access_token, verify_google_id_token

User = get_user_model()


def _cookie_kwargs(max_age: int) -> dict:
    return {
        "httponly": True,
        "samesite": settings.JWT_COOKIE_SAMESITE,
        "secure": settings.JWT_COOKIE_SECURE,
        "path": "/",
        "max_age": max_age,
    }


def _set_jwt_cookies(response: JsonResponse, refresh: RefreshToken) -> None:
    response.set_cookie(
        key=settings.JWT_ACCESS_COOKIE_NAME,
        value=str(refresh.access_token),
        **_cookie_kwargs(int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())),
    )
    response.set_cookie(
        key=settings.JWT_REFRESH_COOKIE_NAME,
        value=str(refresh),
        **_cookie_kwargs(int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())),
    )


def _delete_jwt_cookies(response: JsonResponse) -> None:
    response.delete_cookie(settings.JWT_ACCESS_COOKIE_NAME, path="/", samesite=settings.JWT_COOKIE_SAMESITE)
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME, path="/", samesite=settings.JWT_COOKIE_SAMESITE)


def _build_unique_username(email: str) -> str:
    username_base = (email.split("@")[0] or "user").strip() or "user"
    candidate_username = username_base
    suffix_counter = 1
    while User.objects.filter(username=candidate_username).exists():
        candidate_username = f"{username_base}{suffix_counter}"
        suffix_counter += 1
    return candidate_username


def _generate_code() -> str:
    return f"{secrets.randbelow(10**settings.OTP_CODE_LENGTH):0{settings.OTP_CODE_LENGTH}d}"


def _send_code_email(email: str, code: str, purpose: str) -> None:
    email_subject = "Código de verificação"
    action_label = "registo" if purpose == OTPChallenge.PURPOSE_REGISTER else "login"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Código de Verificação</h2>
                <p>Olá,</p>
                <p>O teu código para <strong>{action_label}</strong> é:</p>
                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h1 style="letter-spacing: 5px; color: #2d6a4f; margin: 0;">{code}</h1>
                </div>
                <p style="color: #666; font-size: 14px;">Este código expira em <strong>{settings.OTP_CODE_EXPIRY_MINUTES} minutos</strong>.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Se não solicitaste este código, ignora este email.</p>
            </div>
        </body>
    </html>
    """

    email_message = EmailMessage(
        subject=email_subject,
        body=html_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )
    email_message.content_subtype = "html"
    email_message.send(fail_silently=False)


def _send_code_email_after_response(email: str, code: str, purpose: str) -> None:
    if "locmem" in settings.EMAIL_BACKEND:
        _send_code_email(email, code, purpose)
        return

    def send_email():
        try:
            _send_code_email(email, code, purpose)
        except Exception as exc:
            print(f"Erro ao enviar codigo de verificacao para {email}: {exc}")

    transaction.on_commit(
        lambda: threading.Thread(
            target=send_email,
            name=f"otp-email-{purpose}",
            daemon=True,
        ).start()
    )


def _issue_jwt_response(user: User):
    refresh_token = RefreshToken.for_user(user)
    response = JsonResponse({"success": True, "user": UserSerializer(user).data})
    _set_jwt_cookies(response, refresh_token)
    return response


def _challenge_response(challenge: OTPChallenge):
    expires_in_seconds = max(0, int((challenge.expires_at - timezone.now()).total_seconds()))
    return Response(
        OTPChallengeResponseSerializer(
            {
                "verification_token": challenge.verification_token,
                "email": challenge.email,
                "purpose": challenge.purpose,
                "expires_in": expires_in_seconds,
            }
        ).data
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        email = validated_data["email"].lower().strip()
        first_name = validated_data["first_name"].strip()
        last_name = validated_data["last_name"].strip()

        try:
            with transaction.atomic():
                user = User.objects.filter(email=email).first()
                if user and user.is_active:
                    return Response({"error": "Este email já está registado."}, status=400)

                if not user:
                    user = User(
                        email=email,
                        username=_build_unique_username(email),
                        first_name=first_name,
                        last_name=last_name,
                        is_active=False,
                    )
                    user.set_unusable_password()
                    user.save()
                else:
                    user.first_name = first_name
                    user.last_name = last_name
                    user.is_active = False
                    if not user.username or "@" in user.username:
                        user.username = _build_unique_username(email)
                    user.save()

                verification_code = _generate_code()
                challenge = OTPChallenge.objects.create(
                    email=email,
                    purpose=OTPChallenge.PURPOSE_REGISTER,
                    code_hash=make_password(verification_code),
                    first_name=first_name,
                    last_name=last_name,
                    payload={"first_name": first_name, "last_name": last_name},
                    expires_at=timezone.now() + timedelta(minutes=settings.OTP_CODE_EXPIRY_MINUTES),
                )
                _send_code_email_after_response(email, verification_code, OTPChallenge.PURPOSE_REGISTER)
                return _challenge_response(challenge)
        except SMTPAuthenticationError:
            return Response(
                {"error": "Falha na autenticação SMTP. Verifica se estás a usar a App Password do Gmail (não a password normal) e se o 2FA está ativo."},
                status=500,
            )
        except Exception as exc:
            return Response({"error": f"Não foi possível enviar o código: {exc}"}, status=500)


class LoginEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginEmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()

        try:
            with transaction.atomic():
                user = User.objects.filter(email=email, is_active=True).first()
                if not user:
                    return Response({"error": "Conta inexistente ou não verificada."}, status=400)

                verification_code = _generate_code()
                challenge = OTPChallenge.objects.create(
                    email=email,
                    purpose=OTPChallenge.PURPOSE_LOGIN,
                    code_hash=make_password(verification_code),
                    expires_at=timezone.now() + timedelta(minutes=settings.OTP_CODE_EXPIRY_MINUTES),
                )
                _send_code_email_after_response(email, verification_code, OTPChallenge.PURPOSE_LOGIN)
                return _challenge_response(challenge)
        except SMTPAuthenticationError:
            return Response(
                {"error": "Falha na autenticação SMTP. Verifica se estás a usar a App Password do Gmail (não a password normal) e se o 2FA está ativo."},
                status=500,
            )
        except Exception as exc:
            return Response({"error": f"Não foi possível enviar o código: {exc}"}, status=500)


class VerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification_token = serializer.validated_data["verification_token"]
        code = serializer.validated_data["code"]

        challenge = OTPChallenge.objects.filter(verification_token=verification_token).first()
        if not challenge:
            return Response({"error": "Código inválido."}, status=400)
        if challenge.is_consumed():
            return Response({"error": "Este código já foi utilizado."}, status=400)
        if challenge.is_expired():
            return Response({"error": "O código expirou."}, status=400)
        if challenge.attempts >= 5:
            return Response({"error": "Demasiadas tentativas. Pede um novo código."}, status=400)

        if not check_password(code, challenge.code_hash):
            challenge.attempts += 1
            challenge.save(update_fields=["attempts"])
            return Response({"error": "Código incorreto."}, status=400)

        challenge.consumed_at = timezone.now()
        challenge.save(update_fields=["consumed_at"])

        if challenge.purpose == OTPChallenge.PURPOSE_REGISTER:
            user = User.objects.filter(email=challenge.email).first()
            if not user:
                user = User(email=challenge.email, username=_build_unique_username(challenge.email))
            user.first_name = challenge.first_name
            user.last_name = challenge.last_name
            user.is_active = True
            user.set_unusable_password()
            user.save()
        else:
            user = User.objects.filter(email=challenge.email, is_active=True).first()
            if not user:
                return Response({"error": "Conta inexistente ou desativada."}, status=400)

        return _issue_jwt_response(user)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        try:
            google_user = verify_google_id_token(token)
        except Exception:
            try:
                google_user = verify_google_access_token(token)
            except Exception as exc:
                return Response({"error": str(exc)}, status=400)

        user, created = User.objects.get_or_create(
            email=google_user.email,
            defaults={
                "username": _build_unique_username(google_user.email),
                "first_name": google_user.name.split(" ", 1)[0] if google_user.name else "",
                "last_name": google_user.name.split(" ", 1)[1] if len(google_user.name.split(" ", 1)) > 1 else "",
                "is_active": True,
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
        else:
            updated = False
            if not user.first_name and google_user.name:
                user.first_name = google_user.name.split(" ", 1)[0]
                updated = True
            if not user.last_name and google_user.name and len(google_user.name.split(" ", 1)) > 1:
                user.last_name = google_user.name.split(" ", 1)[1]
                updated = True
            if not user.username or "@" in user.username:
                user.username = _build_unique_username(google_user.email)
                updated = True
            if not user.is_active:
                user.is_active = True
                updated = True
            if updated:
                user.save()

        return _issue_jwt_response(user)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = JsonResponse({"success": True})
        _delete_jwt_cookies(response)
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response({"error": "Refresh token missing"}, status=401)

        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = str(refresh.access_token)
        except TokenError:
            response = JsonResponse({"error": "Invalid refresh token"}, status=401)
            _delete_jwt_cookies(response)
            return response

        response = JsonResponse({"success": True})
        response.set_cookie(
            key=settings.JWT_ACCESS_COOKIE_NAME,
            value=new_access_token,
            **_cookie_kwargs(int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())),
        )
        return response


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        full_name = str(request.data.get("name", "")).strip()
        if not full_name:
            return Response({"error": "O nome e obrigatorio."}, status=400)

        first_name, _, last_name = full_name.partition(" ")
        request.user.first_name = first_name.strip()
        request.user.last_name = last_name.strip()
        request.user.save(update_fields=["first_name", "last_name"])
        return Response(UserSerializer(request.user).data)
