from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class AppTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add basic user info into the JWT payload so the SPA can build a profile from the token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = getattr(user, "email", "")
        token["name"] = (
            (getattr(user, "get_full_name", lambda: "")() or "").strip()
            or getattr(user, "username", "")
            or getattr(user, "email", "")
        )
        return token


User = get_user_model()
