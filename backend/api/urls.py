from django.urls import path
from .views import (
    EntityListAPIView,
    GoogleLoginView,
    LoginEmailView,
    LogoutView,
    RefreshView,
    RegisterView,
    UserMeView,
    VerifyCodeView,
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

    # dj-rest-auth compatible aliases
    path("dj-rest-auth/google/login/", GoogleLoginView.as_view(), name="dj-rest-auth-google-login"),
    path("dj-rest-auth/token/refresh/", RefreshView.as_view(), name="dj-rest-auth-token-refresh"),

    # API
    path("entities/", EntityListAPIView.as_view(), name="entities"),
]