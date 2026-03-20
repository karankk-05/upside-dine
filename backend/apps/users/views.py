from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserToken, MessAccount
from .serializers import (
    RegisterSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    UserSerializer,
    MessAccountSerializer,
    RefreshTokenSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    DeleteAccountSerializer,
)
from .services import generate_otp, verify_otp, send_otp_email, record_otp_attempt, is_otp_rate_limited


def _get_client_ip(request):
    return request.META.get("REMOTE_ADDR")


class RegisterView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if is_otp_rate_limited(user.email):
            return Response({"detail": "OTP rate limit exceeded."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        otp = generate_otp(user.email)
        try:
            send_otp_email(user.email, otp)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({"detail": "OTP sent to email."}, status=status.HTTP_201_CREATED)


class VerifyOTPView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyOTPSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
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


class LoginView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
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


class RefreshTokenView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RefreshTokenSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh_token = serializer.validated_data["refresh"]
        try:
            refresh = RefreshToken(refresh_token)
            access = str(refresh.access_token)
            return Response({"access": access})
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RefreshTokenSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh_token = serializer.validated_data["refresh"]
        try:
            refresh = RefreshToken(refresh_token)
            jti = refresh.get("jti")
            if jti:
                cache.set(f"blacklist:token:{jti}", True, timeout=refresh.lifetime.total_seconds())
            UserToken.objects.filter(refresh_token=refresh_token).update(is_revoked=True)
            return Response({"detail": "Logged out."})
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if is_otp_rate_limited(email):
            return Response({"detail": "OTP rate limit exceeded."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        otp = generate_otp(email)
        try:
            send_otp_email(email, otp)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({"detail": "OTP sent to email."})


class ResetPasswordView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        otp = serializer.validated_data["otp"]
        new_password = serializer.validated_data["new_password"]
        
        record_otp_attempt(email)
        if not verify_otp(email, otp):
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful."})


class MeView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request):
        return Response(self.get_serializer(request.user).data)

    def patch(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DeleteAccountView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DeleteAccountSerializer

    def delete(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data["password"]
        if not request.user.check_password(password):
            return Response({"detail": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)
        request.user.delete()
        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_200_OK)


class MessAccountView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MessAccountSerializer

    def get(self, request):
        if not hasattr(request.user, "student_profile"):
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
        account = MessAccount.objects.filter(student=request.user.student_profile).first()
        if not account:
            return Response({"detail": "Mess account not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(account).data)