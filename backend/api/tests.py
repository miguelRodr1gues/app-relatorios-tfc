import json
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPChallenge, SavedReport

User = get_user_model()


def _streaming_response_body(response):
    return b"".join(response.streaming_content)


def _json_response_body(response):
    return json.loads(response.content.decode("utf-8"))


class BaseAPITestCase(APITestCase):
    databases = {"default", "auth_db"}

    def create_user(self, email="user@example.com", **extra_fields):
        defaults = {
            "username": email.split("@")[0],
            "first_name": "Test",
            "last_name": "User",
            "is_active": True,
        }
        defaults.update(extra_fields)
        return User.objects.db_manager("auth_db").create_user(email=email, **defaults)

    def authenticate(self, user=None):
        authenticated_user = user or self.create_user()
        self.client.force_authenticate(user=authenticated_user)
        return authenticated_user


class AuthenticationFlowTests(BaseAPITestCase):
    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    @patch("api.views._generate_code", return_value="123456")
    def test_email_login_and_code_verification_issue_jwt_cookies(self, _generate_code):
        self.create_user(email="maria@example.com")

        login_response = self.client.post("/api/auth/login/", {"email": "maria@example.com"}, format="json")

        self.assertEqual(login_response.status_code, 200)
        self.assertIn("verification_token", login_response.data)
        self.assertEqual(len(mail.outbox), 1)

        challenge = OTPChallenge.objects.using("auth_db").get(email="maria@example.com")
        verify_response = self.client.post(
            "/api/auth/verify-code/",
            {"verification_token": str(challenge.verification_token), "code": "123456"},
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(_json_response_body(verify_response)["success"])
        self.assertIn("access_token", verify_response.cookies)
        self.assertIn("refresh_token", verify_response.cookies)

    def test_email_login_with_unknown_account_returns_error(self):
        response = self.client.post("/api/auth/login/", {"email": "missing@example.com"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_protected_endpoint_without_authentication_is_rejected(self):
        response = self.client.get("/api/reports/")

        self.assertIn(response.status_code, [401, 403])

    def test_refresh_token_cookie_creates_new_access_cookie(self):
        user = self.create_user(email="refresh@example.com")
        refresh_token = RefreshToken.for_user(user)
        self.client.cookies["refresh_token"] = str(refresh_token)

        response = self.client.post("/api/auth/refresh/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.cookies)

    def test_invalid_access_token_cookie_is_rejected(self):
        self.client.cookies["access_token"] = "invalid.jwt.token"

        response = self.client.get("/api/reports/")

        self.assertIn(response.status_code, [401, 403])

    @patch("api.views.verify_google_id_token")
    def test_google_login_creates_session_for_valid_google_token(self, verify_google_id_token):
        verify_google_id_token.return_value = SimpleNamespace(
            email="google@example.com",
            name="Google User",
            picture="https://example.com/avatar.png",
        )

        response = self.client.post("/api/auth/google/", {"token": "valid-google-token"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(_json_response_body(response)["success"])
        self.assertIn("access_token", response.cookies)
        self.assertTrue(User.objects.using("auth_db").filter(email="google@example.com").exists())

    @patch("api.views.verify_google_access_token", side_effect=ValueError("invalid token"))
    @patch("api.views.verify_google_id_token", side_effect=ValueError("invalid token"))
    def test_google_login_with_invalid_token_returns_error(self, _verify_google_id_token, _verify_google_access_token):
        response = self.client.post("/api/auth/google/", {"token": "invalid-google-token"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)


class ReportWizardFlowTests(BaseAPITestCase):
    def report_payload(self):
        return {
            "name": "Relatorio de atividades",
            "description": "Dados principais de atividades.",
            "base_table": "activities",
            "related_tables": ["activitiescafe"],
            "columns": [
                {"table": "activities", "column": "id"},
                {"table": "activitiescafe", "column": "acqtd"},
            ],
            "filters": [
                {"table": "activities", "column": "status", "operator": "=", "value": "ativo"},
            ],
            "is_public": False,
        }

    @patch("api.report_views._fetch_report_rows")
    def test_report_preview_returns_real_rows_from_query_layer(self, fetch_report_rows):
        self.authenticate()
        fetch_report_rows.return_value = (
            [{"id": 1, "acqtd": 3}, {"id": 2, "acqtd": 5}],
            None,
            ["id", "acqtd"],
            None,
        )

        response = self.client.post("/api/reports/preview/", self.report_payload(), format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["columns"], ["id", "acqtd"])
        self.assertEqual(len(response.data["rows"]), 2)
        self.assertEqual(response.data["total_preview_rows"], 2)

    def test_report_preview_requires_base_table_and_columns(self):
        self.authenticate()

        response = self.client.post("/api/reports/preview/", {"base_table": "", "columns": []}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    @patch("api.report_views._count_report_rows", return_value=(2, None))
    @patch("api.report_views._fetch_report_rows", return_value=([], None, ["id", "acqtd"], None))
    def test_save_report_persists_configuration_and_exact_record_count(self, _fetch_report_rows, _count_report_rows):
        user = self.authenticate()

        response = self.client.post("/api/reports/", self.report_payload(), format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Relatorio de atividades")
        self.assertEqual(response.data["record_count"], 2)
        self.assertEqual(SavedReport.objects.using("auth_db").filter(owner=user).count(), 1)

    @patch("api.report_views._count_report_rows", return_value=(7, None))
    @patch("api.report_views._fetch_report_rows", return_value=([], None, ["id"], None))
    def test_public_reports_are_visible_to_other_users_but_private_reports_are_not(self, _fetch_report_rows, _count_report_rows):
        owner = self.create_user(email="owner@example.com")
        other_user = self.create_user(email="other@example.com")
        public_report = SavedReport.objects.using("auth_db").create(
            owner=owner,
            name="Publico",
            table="activities",
            columns=[{"table": "activities", "column": "id"}],
            is_public=True,
            record_count=7,
        )
        private_report = SavedReport.objects.using("auth_db").create(
            owner=owner,
            name="Privado",
            table="activities",
            columns=[{"table": "activities", "column": "id"}],
            is_public=False,
            record_count=7,
        )
        self.authenticate(other_user)

        response = self.client.get("/api/reports/")

        self.assertEqual(response.status_code, 200)
        returned_ids = {item["id"] for item in response.data}
        self.assertIn(str(public_report.id), returned_ids)
        self.assertNotIn(str(private_report.id), returned_ids)

    def test_report_can_be_deleted_by_owner(self):
        owner = self.authenticate()
        saved_report = SavedReport.objects.using("auth_db").create(
            owner=owner,
            name="Para eliminar",
            table="activities",
            columns=[{"table": "activities", "column": "id"}],
        )

        response = self.client.delete(f"/api/reports/{saved_report.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SavedReport.objects.using("auth_db").filter(id=saved_report.id).exists())


class ReportExportTests(BaseAPITestCase):
    def setUp(self):
        self.owner = self.authenticate(self.create_user(email="exports@example.com"))
        self.saved_report = SavedReport.objects.using("auth_db").create(
            owner=self.owner,
            name="Exportacao",
            description="Relatorio para exportacao.",
            table="activities",
            related_tables=["activitiescafe"],
            columns=[
                {"table": "activities", "column": "id"},
                {"table": "activitiescafe", "column": "acqtd"},
            ],
            filters=[],
            is_public=False,
            record_count=2,
        )

    @patch("api.report_views._fetch_report_rows")
    def test_export_report_as_json(self, fetch_report_rows):
        fetch_report_rows.return_value = ([{"id": 1, "acqtd": 3}], None, ["id", "acqtd"], None)

        response = self.client.get(f"/api/reports/{self.saved_report.id}/download/?export_format=json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertIn(b'"acqtd": 3', _streaming_response_body(response))

    @patch("api.report_views._fetch_report_rows")
    def test_export_report_as_csv(self, fetch_report_rows):
        fetch_report_rows.return_value = ([{"id": 1, "acqtd": 3}], None, ["id", "acqtd"], None)

        response = self.client.get(f"/api/reports/{self.saved_report.id}/download/?export_format=csv")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response["Content-Type"].startswith("text/csv"))
        self.assertIn(b"id;acqtd", _streaming_response_body(response))

    @patch("api.report_views._build_minimal_pdf", return_value=b"%PDF-1.4 test")
    @patch("api.report_views._fetch_report_rows")
    def test_export_report_as_pdf(self, fetch_report_rows, _build_minimal_pdf):
        fetch_report_rows.return_value = ([{"id": 1, "acqtd": 3}], None, ["id", "acqtd"], None)

        response = self.client.get(f"/api/reports/{self.saved_report.id}/download/?export_format=pdf")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(_streaming_response_body(response).startswith(b"%PDF"))

    def test_private_report_cannot_be_exported_by_other_user(self):
        self.authenticate(self.create_user(email="intruder@example.com"))

        response = self.client.get(f"/api/reports/{self.saved_report.id}/download/?export_format=json")

        self.assertEqual(response.status_code, 403)


class StructureScreenTests(BaseAPITestCase):
    def test_structure_endpoint_returns_er_payload_shape(self):
        self.authenticate()

        response = self.client.get("/api/schema/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("tables", response.data)
        self.assertIsInstance(response.data["tables"], list)

    def test_structure_endpoint_requires_authentication(self):
        response = self.client.get("/api/schema/")

        self.assertIn(response.status_code, [401, 403])


class OTPChallengeModelTests(BaseAPITestCase):
    def test_expired_and_consumed_helpers_reflect_challenge_state(self):
        challenge = OTPChallenge.objects.using("auth_db").create(
            email="otp@example.com",
            purpose=OTPChallenge.PURPOSE_LOGIN,
            code_hash="hash",
            expires_at=timezone.now() - timezone.timedelta(minutes=1),
            consumed_at=timezone.now(),
        )

        self.assertTrue(challenge.is_expired())
        self.assertTrue(challenge.is_consumed())
