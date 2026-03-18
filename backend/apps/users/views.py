from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserToken, MessAccount
from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    UserSerializer,
    MessAccountSerializer,
)
from .services import generate_otp, verify_otp, send_otp_email, record_otp_attempt, is_otp_rate_limited


def _get_client_ip(request):
    return request.META.get("REMOTE_ADDR")


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if is_otp_rate_limited(user.email):
            return Response({"detail": "OTP rate limit exceeded."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        otp = generate_otp(user.email)
        send_otp_email(user.email, otp)
        return Response({"detail": "OTP sent to email."}, status=status.HTTP_201_CREATED)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        otp = serializer.validated_data["otp"]
        record_otp_attempt(email)
        if not verify_otp(email, otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.is_verified = True
        user.is_active = True
        user.save(update_fields=["is_verified", "is_active"])
        return Response({"detail": "Email verified successfully."})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        UserToken.objects.create(
            user=user,
            refresh_token=refresh_token,
            device_info=request.META.get("HTTP_USER_AGENT", "")[:200],
            ip_address=_get_client_ip(request),
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )

        return Response({"access": access_token, "refresh": refresh_token})


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            access = str(refresh.access_token)
            return Response({"access": access})
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_token)
            jti = refresh.get("jti")
            if jti:
                cache.set(f"blacklist:token:{jti}", True, timeout=refresh.lifetime.total_seconds())
            UserToken.objects.filter(refresh_token=refresh_token).update(is_revoked=True)
            return Response({"detail": "Logged out."})
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if is_otp_rate_limited(email):
            return Response({"detail": "OTP rate limit exceeded."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        otp = generate_otp(email)
        send_otp_email(email, otp)
        return Response({"detail": "OTP sent to email."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")
        if not (email and otp and new_password):
            return Response({"detail": "Email, OTP, and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)
        record_otp_attempt(email)
        if not verify_otp(email, otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MessAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, "student_profile"):
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
        account = MessAccount.objects.filter(student=request.user.student_profile).first()
        if not account:
            return Response({"detail": "Mess account not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(MessAccountSerializer(account).data)