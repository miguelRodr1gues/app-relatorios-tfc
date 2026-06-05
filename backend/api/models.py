from django.db import models
from django.conf import settings
import os
import uuid as _uuid


class OTPChallenge(models.Model):
	PURPOSE_REGISTER = "register"
	PURPOSE_LOGIN = "login"

	PURPOSE_CHOICES = (
		(PURPOSE_REGISTER, "Register"),
		(PURPOSE_LOGIN, "Login"),
	)

	verification_token = models.UUIDField(default=_uuid.uuid4, unique=True, editable=False)
	email = models.EmailField(db_index=True)
	purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
	code_hash = models.CharField(max_length=128)
	first_name = models.CharField(max_length=150, blank=True, default="")
	last_name = models.CharField(max_length=150, blank=True, default="")
	payload = models.JSONField(default=dict, blank=True)
	attempts = models.PositiveSmallIntegerField(default=0)
	expires_at = models.DateTimeField()
	consumed_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		indexes = [
			models.Index(fields=["verification_token"]),
			models.Index(fields=["email", "purpose"]),
			models.Index(fields=["expires_at"]),
		]
		ordering = ["-created_at"]

	def is_expired(self):
		from django.utils import timezone

		return timezone.now() >= self.expires_at

	def is_consumed(self):
		return self.consumed_at is not None


class SavedReport(models.Model):
    id = models.UUIDField(primary_key=True, default=_uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    table = models.CharField(max_length=255)
    related_tables = models.JSONField(default=list, blank=True)
    columns = models.JSONField(default=list)
    filters = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Paths relative to BASE_DIR (strings) where generated files are saved
    file_json = models.CharField(max_length=500, null=True, blank=True)
    file_csv = models.CharField(max_length=500, null=True, blank=True)
    file_pdf = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def generated_dir(self):
        from django.conf import settings as _s
        return os.path.join(_s.BASE_DIR, "generated_reports")

    def json_path(self):
        return self.file_json

    def csv_path(self):
        return self.file_csv

    def pdf_path(self):
        return self.file_pdf

