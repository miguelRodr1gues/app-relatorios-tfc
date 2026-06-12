import json
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPChallenge, SavedReport
from .report_exports import _build_csv_bytes, _build_json_bytes, _format_pdf_column_label, _set_download_response_headers
from .report_services import (
    _build_preview_report_definition,
    _build_report_query_definition,
    _build_report_request_payload,
    _compose_table_key,
    _guess_column_type,
    _humanize_identifier,
    _normalize_report_column,
    _normalize_report_columns,
    _normalize_report_filters,
    _normalize_related_tables,
    _normalize_table_key,
    _split_table_key,
)
from .report_sql import _build_filter_sql_parts
from .serializers import LoginEmailRequestSerializer, RegisterStartSerializer, SavedReportSerializer, UserSerializer, VerifyCodeSerializer

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

    def test_authenticated_user_can_update_display_name(self):
        user = self.authenticate(self.create_user(email="profile@example.com"))

        response = self.client.patch("/api/auth/user/", {"name": "Maria Silva"}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Maria Silva")
        user.refresh_from_db(using="auth_db")
        self.assertEqual(user.first_name, "Maria")
        self.assertEqual(user.last_name, "Silva")

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


class OTPChallengeUnitTests(TestCase):
    databases = {"auth_db"}

    def create_challenge(self, **overrides):
        defaults = {
            "email": "otp-unit@example.com",
            "purpose": OTPChallenge.PURPOSE_LOGIN,
            "code_hash": "hash",
            "expires_at": timezone.now() + timezone.timedelta(minutes=5),
        }
        defaults.update(overrides)
        return OTPChallenge.objects.using("auth_db").create(**defaults)

    def test_is_expired_returns_true_when_expiry_is_in_the_past(self):
        challenge = self.create_challenge(expires_at=timezone.now() - timezone.timedelta(seconds=1))

        self.assertTrue(challenge.is_expired())

    def test_is_expired_returns_false_when_expiry_is_in_the_future(self):
        challenge = self.create_challenge(expires_at=timezone.now() + timezone.timedelta(minutes=1))

        self.assertFalse(challenge.is_expired())

    def test_is_consumed_returns_true_when_consumed_at_exists(self):
        challenge = self.create_challenge(consumed_at=timezone.now())

        self.assertTrue(challenge.is_consumed())

    def test_is_consumed_returns_false_when_consumed_at_is_none(self):
        challenge = self.create_challenge(consumed_at=None)

        self.assertFalse(challenge.is_consumed())


class SavedReportModelUnitTests(TestCase):
    databases = {"auth_db"}

    def create_user(self, email="report-owner@example.com"):
        return User.objects.db_manager("auth_db").create_user(
            username=email.split("@")[0],
            email=email,
            first_name="Report",
            last_name="Owner",
            is_active=True,
        )

    def test_saved_report_persists_all_configured_fields(self):
        owner = self.create_user()
        related_tables = ["activitiescafe", "public.users"]
        columns = [
            {"table": "activities", "column": "id"},
            {"table": "activitiescafe", "column": "acqtd"},
        ]
        filters = [{"table": "activities", "column": "status", "operator": "=", "value": "ativo"}]

        report = SavedReport.objects.using("auth_db").create(
            owner=owner,
            name="Relatorio unitario",
            table="activities",
            related_tables=related_tables,
            columns=columns,
            filters=filters,
            record_count=42,
            is_public=True,
        )

        saved_report = SavedReport.objects.using("auth_db").get(id=report.id)
        self.assertEqual(saved_report.owner, owner)
        self.assertEqual(saved_report.name, "Relatorio unitario")
        self.assertEqual(saved_report.table, "activities")
        self.assertEqual(saved_report.related_tables, related_tables)
        self.assertEqual(saved_report.columns, columns)
        self.assertEqual(saved_report.filters, filters)
        self.assertEqual(saved_report.record_count, 42)
        self.assertTrue(saved_report.is_public)

    def test_saved_report_is_private_by_default(self):
        report = SavedReport.objects.using("auth_db").create(
            owner=self.create_user("private@example.com"),
            name="Privado",
            table="activities",
            columns=[{"table": "activities", "column": "id"}],
        )

        self.assertFalse(report.is_public)

    def test_saved_report_can_be_saved_as_private_explicitly(self):
        report = SavedReport.objects.using("auth_db").create(
            owner=self.create_user("explicit-private@example.com"),
            name="Privado explicito",
            table="activities",
            columns=[{"table": "activities", "column": "id"}],
            is_public=False,
        )

        self.assertFalse(report.is_public)


class SerializerUnitTests(TestCase):
    databases = {"auth_db"}

    def test_register_start_serializer_accepts_valid_payload(self):
        serializer = RegisterStartSerializer(
            data={"first_name": "Maria", "last_name": "Silva", "email": "maria@example.com"}
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_register_start_serializer_rejects_invalid_email(self):
        serializer = RegisterStartSerializer(
            data={"first_name": "Maria", "last_name": "Silva", "email": "invalid-email"}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_login_email_request_serializer_rejects_invalid_email(self):
        serializer = LoginEmailRequestSerializer(data={"email": "not-an-email"})

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_verify_code_serializer_accepts_six_digit_code(self):
        serializer = VerifyCodeSerializer(
            data={"verification_token": "8a72ec7a-7b52-4ec7-8f4b-c03c2d8b92d1", "code": "123456"}
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_verify_code_serializer_rejects_short_code(self):
        serializer = VerifyCodeSerializer(
            data={"verification_token": "8a72ec7a-7b52-4ec7-8f4b-c03c2d8b92d1", "code": "12345"}
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("code", serializer.errors)

    def test_user_serializer_prefers_full_name(self):
        user = User.objects.db_manager("auth_db").create_user(
            username="maria",
            email="maria@example.com",
            first_name="Maria",
            last_name="Silva",
        )

        self.assertEqual(UserSerializer(user).data["name"], "Maria Silva")

    def test_user_serializer_falls_back_to_username_without_email_domain(self):
        user = User.objects.db_manager("auth_db").create_user(username="fallback", email="fallback@example.com")

        self.assertEqual(UserSerializer(user).data["name"], "fallback")

    def test_saved_report_serializer_exposes_base_table_alias(self):
        owner = User.objects.db_manager("auth_db").create_user(username="owner", email="owner@example.com")
        report = SavedReport.objects.using("auth_db").create(
            owner=owner,
            name="Serializado",
            table="activities",
            columns=[{"table": "activities", "column": "id"}],
        )

        data = SavedReportSerializer(report).data

        self.assertEqual(data["base_table"], "activities")
        self.assertEqual(data["table"], "activities")


class ReportServiceHelperUnitTests(TestCase):
    def test_humanize_identifier_replaces_underscores_and_title_cases(self):
        self.assertEqual(_humanize_identifier("utente_nome"), "Utente Nome")

    def test_guess_column_type_maps_numeric_date_and_text_values(self):
        self.assertEqual(_guess_column_type("integer", ""), "number")
        self.assertEqual(_guess_column_type("timestamp without time zone", ""), "date")
        self.assertEqual(_guess_column_type("boolean", ""), "text")
        self.assertEqual(_guess_column_type("character varying", "varchar"), "text")

    def test_split_and_compose_table_key_handle_public_and_custom_schema(self):
        self.assertEqual(_split_table_key("custom.activities"), ("custom", "activities"))
        self.assertEqual(_split_table_key("activities"), ("public", "activities"))
        self.assertEqual(_compose_table_key("public", "activities"), "activities")
        self.assertEqual(_compose_table_key("custom", "activities"), "custom.activities")

    def test_normalize_table_key_rejects_non_string_values(self):
        self.assertEqual(_normalize_table_key(None), "")
        self.assertEqual(_normalize_table_key(123), "")

    def test_normalize_report_column_accepts_string_and_dict_shapes(self):
        self.assertEqual(_normalize_report_column("activities.id"), "id")
        self.assertEqual(_normalize_report_column("activities::status"), "status")
        self.assertEqual(_normalize_report_column({"column": "acqtd"}), "acqtd")
        self.assertEqual(_normalize_report_column({"n": "created_at"}), "created_at")

    def test_normalize_report_columns_discards_invalid_entries(self):
        columns = _normalize_report_columns(
            ["activities.id", {"table": "activitiescafe", "column": "acqtd"}, {"table": "", "column": ""}, None],
            "activities",
        )

        self.assertEqual(
            columns,
            [
                {"table": "activities", "column": "id"},
                {"table": "activitiescafe", "column": "acqtd"},
            ],
        )

    def test_normalize_report_filters_discards_incomplete_filters(self):
        filters = _normalize_report_filters(
            [
                {"column": "status", "operator": "=", "value": "ativo"},
                {"column": ""},
                "invalid",
            ],
            "activities",
        )

        self.assertEqual(filters, [{"table": "activities", "column": "status", "operator": "=", "value": "ativo"}])

    def test_normalize_related_tables_removes_duplicates_and_invalid_values(self):
        self.assertEqual(
            _normalize_related_tables(["activitiescafe", "activitiescafe", None, "custom.users"]),
            ["activitiescafe", "custom.users"],
        )

    def test_build_report_request_payload_normalizes_report_input(self):
        payload = _build_report_request_payload(
            {
                "base_table": "activities",
                "related_tables": ["activitiescafe", "activitiescafe"],
                "columns": ["activities.id", {"table": "activitiescafe", "column": "acqtd"}],
                "filters": [{"column": "status", "operator": "=", "value": "ativo"}],
            }
        )

        self.assertEqual(payload["base_table_key"], "activities")
        self.assertEqual(payload["selected_related_table_keys"], ["activitiescafe"])
        self.assertEqual(payload["normalized_columns"][0], {"table": "activities", "column": "id"})
        self.assertEqual(payload["normalized_filters"], [{"table": "activities", "column": "status", "operator": "=", "value": "ativo"}])

    def test_build_preview_report_definition_returns_namespace_for_query_layer(self):
        report_definition = _build_preview_report_definition(
            {
                "base_table_key": "activities",
                "selected_related_table_keys": ["activitiescafe"],
                "normalized_columns": [{"table": "activities", "column": "id"}],
                "normalized_filters": [],
            }
        )

        self.assertEqual(report_definition.table, "activities")
        self.assertEqual(report_definition.related_tables, ["activitiescafe"])
        self.assertEqual(report_definition.columns, [{"table": "activities", "column": "id"}])
        self.assertEqual(report_definition.filters, [])

    def test_build_report_query_definition_normalizes_saved_report_like_object(self):
        report = SimpleNamespace(
            table="activities",
            related_tables=["activitiescafe", "activitiescafe"],
            columns=["activities.id", {"table": "activitiescafe", "column": "acqtd"}],
            filters=[{"column": "status", "operator": "=", "value": "ativo"}],
        )

        base_table, related_tables, columns, filters = _build_report_query_definition(report)

        self.assertEqual(base_table, "activities")
        self.assertEqual(related_tables, ["activitiescafe"])
        self.assertEqual(columns[1], {"table": "activitiescafe", "column": "acqtd"})
        self.assertEqual(filters, [{"table": "activities", "column": "status", "operator": "=", "value": "ativo"}])

    def test_build_filter_sql_parts_builds_id_equality_filter(self):
        where_sql_parts, query_params = _build_filter_sql_parts(
            [{"table": "activities", "column": "id", "operator": "=", "value": "12"}],
            {"activities": ["id", "status"]},
        )

        self.assertEqual(where_sql_parts, ['"id" = %s'])
        self.assertEqual(query_params, ["12"])

    def test_build_filter_sql_parts_uses_table_alias_for_relational_filters(self):
        where_sql_parts, query_params = _build_filter_sql_parts(
            [{"table": "activities", "column": "id", "operator": "=", "value": "12"}],
            {"activities": ["id"]},
            {"activities": "t0"},
        )

        self.assertEqual(where_sql_parts, ['t0."id" = %s'])
        self.assertEqual(query_params, ["12"])

    def test_build_filter_sql_parts_supports_numeric_comparison_and_like(self):
        where_sql_parts, query_params = _build_filter_sql_parts(
            [
                {"table": "activities", "column": "id", "operator": ">=", "value": "10"},
                {"table": "activities", "column": "descricao", "operator": "LIKE", "value": "consulta"},
            ],
            {"activities": ["id", "descricao"]},
        )

        self.assertEqual(where_sql_parts, ['"id" >= %s', '"descricao" LIKE %s'])
        self.assertEqual(query_params, ["10", "%consulta%"])

    def test_build_filter_sql_parts_ignores_invalid_or_empty_filters(self):
        where_sql_parts, query_params = _build_filter_sql_parts(
            [
                {"table": "activities", "column": "missing", "operator": "=", "value": "1"},
                {"table": "activities", "column": "id", "operator": "=", "value": ""},
                {"table": "", "column": "id", "operator": "=", "value": "1"},
            ],
            {"activities": ["id"]},
        )

        self.assertEqual(where_sql_parts, [])
        self.assertEqual(query_params, [])


class ReportExportHelperUnitTests(TestCase):
    def test_build_csv_bytes_uses_semicolon_delimiter_and_utf8_bom(self):
        csv_bytes = _build_csv_bytes(["id", "nome"], [{"id": 1, "nome": "Maria"}])

        self.assertTrue(csv_bytes.startswith(b"\xef\xbb\xbf"))
        self.assertIn(b"id;nome", csv_bytes)
        self.assertIn(b"1;Maria", csv_bytes)

    def test_build_csv_bytes_writes_empty_value_for_missing_column(self):
        csv_bytes = _build_csv_bytes(["id", "nome"], [{"id": 1}])

        self.assertIn(b"1;", csv_bytes)

    def test_build_json_bytes_outputs_pretty_utf8_json(self):
        json_bytes = _build_json_bytes([{"nome": "Maria", "total": 2}])
        decoded = json_bytes.decode("utf-8")

        self.assertIn('"nome": "Maria"', decoded)
        self.assertIn('"total": 2', decoded)
        self.assertTrue(decoded.startswith("[\n"))

    def test_format_pdf_column_label_humanizes_table_prefixed_column(self):
        self.assertEqual(_format_pdf_column_label("utente.utente_nome"), "Utente nome")
        self.assertEqual(_format_pdf_column_label("created-at"), "Created at")
        self.assertEqual(_format_pdf_column_label(""), "")

    def test_set_download_response_headers_sets_content_disposition_and_exposed_header(self):
        response = {}

        _set_download_response_headers(response, "relatorio.csv")

        self.assertEqual(response["Content-Disposition"], 'attachment; filename="relatorio.csv"')
        self.assertEqual(response["Access-Control-Expose-Headers"], "Content-Disposition")
