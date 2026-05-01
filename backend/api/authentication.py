from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get(settings.JWT_ACCESS_COOKIE_NAME)

        if not token:
            return None

        try:
            validated_token = self.get_validated_token(token)
        except (InvalidToken, TokenError):
            return None

        user = self.get_user(validated_token)

        return (user, validated_token)