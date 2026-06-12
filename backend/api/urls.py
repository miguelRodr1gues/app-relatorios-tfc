from django.urls import path
from .views import (
    GoogleLoginView,
    LoginEmailView,
    LogoutView,
    RefreshView,
    RegisterView,
    UserMeView,
    VerifyCodeView,
)
from .report_views import (
    EntityListAPIView,
    ReportsListCreateAPIView,
    ReportPreviewAPIView,
    ReportDetailAPIView,
    ReportDownloadView,
    SchemaAPIView,
)

urlpatterns = [
    # AUTH (JWT via cookies)
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginEmailView.as_view(), name="login"),
    path("auth/verify-code/", VerifyCodeView.as_view(), name="verify-code"),
    path("auth/google/", GoogleLoginView.as_view(), name="google-login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/refresh/", RefreshView.as_view(), name="refresh"),
    path("auth/user/", UserMeView.as_view(), name="auth-user"),

    # API
    path("entities/", EntityListAPIView.as_view(), name="entities"),
    path("schema/", SchemaAPIView.as_view(), name="schema"),
    path("reports/", ReportsListCreateAPIView.as_view(), name="reports-list-create"),
    path("reports/preview/", ReportPreviewAPIView.as_view(), name="reports-preview"),
    path("reports/<uuid:pk>/download/", ReportDownloadView.as_view(), name="reports-download"),
    path("reports/<uuid:pk>/", ReportDetailAPIView.as_view(), name="reports-detail"),
]
