from django.urls import path

from .views import (
    RegisterView,
    VerifyOTPView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    ForgotPasswordView,
    ResetPasswordView,
    MeView,
    MessAccountView,
    DeleteAccountView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/verify-otp/", VerifyOTPView.as_view(), name="auth-verify-otp"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/mess-account/", MessAccountView.as_view(), name="users-me-mess-account"),
    path("users/me/delete/", DeleteAccountView.as_view(), name="users-me-delete"),
]