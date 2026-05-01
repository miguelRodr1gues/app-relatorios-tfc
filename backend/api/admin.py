from django.contrib import admin
from .models import OTPChallenge


@admin.register(OTPChallenge)
class OTPChallengeAdmin(admin.ModelAdmin):
	list_display = ("verification_token", "email", "purpose", "attempts", "expires_at", "consumed_at", "created_at")
	search_fields = ("email", "verification_token")
	list_filter = ("purpose", "consumed_at")
