from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from .models import User, UserToken, MessAccount, Role
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

        # Return tokens + user info so frontend knows the role immediately
        role = None
        if user.is_superuser:
            role = "superadmin"
        elif user.role:
            role = user.role.role_name

        return Response({
            "access": access_token,
            "refresh": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": role,
                "is_superuser": user.is_superuser,
            },
        })


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

    @extend_schema(request=DeleteAccountSerializer)
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



class DeliveryPersonnelManagementView(GenericAPIView):
    """View for canteen managers to manage delivery personnel"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            from .serializers import CreateDeliveryPersonSerializer
            return CreateDeliveryPersonSerializer
        from .serializers import DeliveryPersonSerializer
        return DeliveryPersonSerializer

    def get(self, request):
        """List all delivery personnel for this canteen manager"""
        # Check if user is canteen manager
        if not hasattr(request.user, 'staff_profile') or request.user.role.role_name != 'canteen_manager':
            return Response({"detail": "Only canteen managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        canteen_id = request.user.staff_profile.canteen_id

        # Get all delivery personnel for this canteen
        delivery_role = Role.objects.filter(role_name='delivery_person').first()
        if not delivery_role:
            return Response([], status=status.HTTP_200_OK)

        delivery_personnel = User.objects.filter(
            role=delivery_role,
            staff_profile__canteen_id=canteen_id
        ).select_related('staff_profile')

        from .serializers import DeliveryPersonSerializer
        serializer = DeliveryPersonSerializer(delivery_personnel, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new delivery person"""
        # Check if user is canteen manager
        if not hasattr(request.user, 'staff_profile') or request.user.role.role_name != 'canteen_manager':
            return Response({"detail": "Only canteen managers can create delivery personnel."}, status=status.HTTP_403_FORBIDDEN)

        from .serializers import CreateDeliveryPersonSerializer
        serializer = CreateDeliveryPersonSerializer(data=request.data, context={'canteen_manager': request.user})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response({
            "detail": "Delivery person created successfully.",
            "email": result['user'].email,
            "temp_password": result['temp_password'],
            "employee_code": result['employee_code'],
        }, status=status.HTTP_201_CREATED)


class ToggleDeliveryPersonStatusView(GenericAPIView):
    """View for canteen managers to activate/deactivate delivery personnel"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        """Toggle delivery person active status"""
        # Check if user is canteen manager
        if not hasattr(request.user, 'staff_profile') or request.user.role.role_name != 'canteen_manager':
            return Response({"detail": "Only canteen managers can manage delivery personnel."}, status=status.HTTP_403_FORBIDDEN)

        canteen_id = request.user.staff_profile.canteen_id

        # Get delivery person
        try:
            delivery_person = User.objects.select_related('staff_profile', 'role').get(
                id=user_id,
                role__role_name='delivery_person',
                staff_profile__canteen_id=canteen_id
            )
        except User.DoesNotExist:
            return Response({"detail": "Delivery person not found."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle active status
        delivery_person.is_active = not delivery_person.is_active
        delivery_person.save(update_fields=['is_active'])

        status_text = "activated" if delivery_person.is_active else "deactivated"
        return Response({
            "detail": f"Delivery person {status_text} successfully.",
            "is_active": delivery_person.is_active
        })



class AdminManagerManagementView(GenericAPIView):
    """View for admin managers to manage canteen/mess managers"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            from .serializers import CreateManagerSerializer
            return CreateManagerSerializer
        from .serializers import ManagerSerializer
        return ManagerSerializer

    def get(self, request):
        """List all canteen and mess managers"""
        # Check if user is admin manager
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        # Get all canteen and mess managers
        manager_roles = Role.objects.filter(role_name__in=['canteen_manager', 'mess_manager'])
        managers = User.objects.filter(role__in=manager_roles).select_related('staff_profile', 'role')

        from .serializers import ManagerSerializer
        serializer = ManagerSerializer(managers, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new canteen or mess manager"""
        # Check if user is admin manager
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can create managers."}, status=status.HTTP_403_FORBIDDEN)

        print(f"DEBUG: Received data: {request.data}")  # Debug log
        
        from .serializers import CreateManagerSerializer
        serializer = CreateManagerSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"DEBUG: Validation errors: {serializer.errors}")  # Debug log
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        result = serializer.save()

        return Response({
            "detail": "Manager created successfully.",
            "email": result['user'].email,
            "temp_password": result['temp_password'],
            "employee_code": result['employee_code'],
        }, status=status.HTTP_201_CREATED)


class ToggleManagerStatusView(GenericAPIView):
    """View for admin managers to activate/deactivate canteen/mess managers"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        """Toggle manager active status (freeze/unfreeze)"""
        # Check if user is admin manager
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can manage managers."}, status=status.HTTP_403_FORBIDDEN)

        # Get manager
        try:
            manager = User.objects.select_related('staff_profile', 'role').get(
                id=user_id,
                role__role_name__in=['canteen_manager', 'mess_manager']
            )
        except User.DoesNotExist:
            return Response({"detail": "Manager not found."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle active status
        manager.is_active = not manager.is_active
        manager.save(update_fields=['is_active'])

        status_text = "activated" if manager.is_active else "frozen"
        return Response({
            "detail": f"Manager {status_text} successfully.",
            "is_active": manager.is_active
        })

    def delete(self, request, user_id):
        """Delete a manager account"""
        # Check if user is admin manager
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can delete managers."}, status=status.HTTP_403_FORBIDDEN)

        # Get manager
        try:
            manager = User.objects.select_related('staff_profile', 'role').get(
                id=user_id,
                role__role_name__in=['canteen_manager', 'mess_manager']
            )
        except User.DoesNotExist:
            return Response({"detail": "Manager not found."}, status=status.HTTP_404_NOT_FOUND)

        manager_email = manager.email
        manager.delete()

        return Response({
            "detail": f"Manager {manager_email} deleted successfully."
        })
