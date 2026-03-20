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
    path("auth/register/", RegisterView.as_view()),
    path("auth/verify-otp/", VerifyOTPView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", RefreshTokenView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/forgot-password/", ForgotPasswordView.as_view()),
    path("auth/reset-password/", ResetPasswordView.as_view()),
    path("users/me/", MeView.as_view()),
    path("users/me/mess-account/", MessAccountView.as_view()),
    path("users/me/delete/", DeleteAccountView.as_view()),
]