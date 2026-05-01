from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import OTPChallenge

User = get_user_model()


class GoogleTokenSerializer(serializers.Serializer):
    token = serializers.CharField()


class RegisterStartSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()


class LoginEmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyCodeSerializer(serializers.Serializer):
    verification_token = serializers.UUIDField()
    code = serializers.CharField(min_length=6, max_length=6)


class OTPChallengeResponseSerializer(serializers.Serializer):
    verification_token = serializers.UUIDField()
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTPChallenge.PURPOSE_CHOICES)
    expires_in = serializers.IntegerField()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "name", "avatar"]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        if full_name:
            return full_name

        username = (getattr(obj, "username", "") or "").strip()
        if "@" in username:
            username = username.split("@")[0]
        if username:
            return username

        email = (getattr(obj, "email", "") or "").strip()
        return email.split("@")[0] if "@" in email else email

    def get_avatar(self, obj):
        avatar = getattr(obj, "avatar", None)
        if avatar:
            return getattr(avatar, "url", str(avatar))

        picture = getattr(obj, "picture", None)
        return picture or None
