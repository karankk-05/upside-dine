import re

from django.db import transaction
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
    UserProfileUpdateSerializer,
    MessAccountSerializer,
    RefreshTokenSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    DeleteAccountSerializer,
)
from apps.mess.models import Mess
from .services import generate_otp, verify_otp, send_otp_email, record_otp_attempt, is_otp_rate_limited


def _get_client_ip(request):
    return request.META.get("REMOTE_ADDR")


def _natural_sort_key(value):
    parts = re.split(r"(\d+)", value or "")
    return [int(part) if part.isdigit() else part.lower() for part in parts]


def _get_managed_mess_worker(request, user_id):
    if not hasattr(request.user, 'role') or request.user.role.role_name != 'mess_manager':
        return None, Response({"detail": "Only mess managers can manage workers."}, status=status.HTTP_403_FORBIDDEN)

    manager_staff = getattr(request.user, 'staff_profile', None)
    if manager_staff is None:
        return None, Response({"detail": "Mess manager profile not found."}, status=status.HTTP_403_FORBIDDEN)

    from apps.mess.models import MessStaffAssignment

    manager_assignment = MessStaffAssignment.objects.filter(
        staff=manager_staff, assignment_role='manager', is_active=True
    ).first()
    if not manager_assignment:
        return None, Response({"detail": "You are not assigned to any mess."}, status=status.HTTP_403_FORBIDDEN)

    worker_assignment = MessStaffAssignment.objects.filter(
        mess=manager_assignment.mess, assignment_role='worker', staff__user_id=user_id
    ).select_related('staff__user').first()

    if not worker_assignment:
        return None, Response({"detail": "Worker not found in your mess."}, status=status.HTTP_404_NOT_FOUND)

    return worker_assignment.staff.user, None


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

        print("--- DEBUG LOGIN ROUTING (BACKEND) ---")
        print(f"1. Authenticated User Email: {user.email}")
        print(f"2. User Has role assigned in DB?: {user.role is not None}")
        print(f"3. Extracted Role String (to be returned): '{role}'")
        print("-------------------------------------")

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

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserProfileUpdateSerializer
        return UserSerializer

    def get(self, request):
        return Response(self.get_serializer(request.user).data)

    def patch(self, request):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


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

        canteen = request.user.staff_profile.canteen

        # Get all delivery personnel for this canteen
        delivery_role = Role.objects.filter(role_name='delivery_person').first()
        if not delivery_role:
            return Response([], status=status.HTTP_200_OK)

        delivery_personnel = User.objects.filter(
            role=delivery_role,
            staff_profile__canteen=canteen
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

    def _get_delivery_person(self, request, user_id):
        if not hasattr(request.user, 'staff_profile') or request.user.role.role_name != 'canteen_manager':
            return None, Response({"detail": "Only canteen managers can manage delivery personnel."}, status=status.HTTP_403_FORBIDDEN)

        canteen = request.user.staff_profile.canteen

        try:
            delivery_person = User.objects.select_related('staff_profile', 'role').get(
                id=user_id,
                role__role_name='delivery_person',
                staff_profile__canteen=canteen
            )
        except User.DoesNotExist:
            return None, Response({"detail": "Delivery person not found."}, status=status.HTTP_404_NOT_FOUND)

        return delivery_person, None

    def patch(self, request, user_id):
        """Toggle delivery person active status"""
        delivery_person, error = self._get_delivery_person(request, user_id)
        if error:
            return error

        # Toggle active status
        delivery_person.is_active = not delivery_person.is_active
        delivery_person.save(update_fields=['is_active'])

        status_text = "activated" if delivery_person.is_active else "deactivated"
        return Response({
            "detail": f"Delivery person {status_text} successfully.",
            "is_active": delivery_person.is_active
        })

    @transaction.atomic
    def delete(self, request, user_id):
        """Delete a delivery person account and release assigned active orders."""
        delivery_person, error = self._get_delivery_person(request, user_id)
        if error:
            return error

        from apps.orders.models import CanteenOrder

        active_delivery_statuses = [
            CanteenOrder.STATUS_CONFIRMED,
            CanteenOrder.STATUS_PREPARING,
            CanteenOrder.STATUS_READY,
            CanteenOrder.STATUS_OUT_FOR_DELIVERY,
        ]
        reopened_statuses = [CanteenOrder.STATUS_OUT_FOR_DELIVERY]
        now = timezone.now()

        assigned_orders = CanteenOrder.objects.filter(
            delivery_person=delivery_person,
            status__in=active_delivery_statuses,
        )
        reopened_count = assigned_orders.filter(status__in=reopened_statuses).update(
            status=CanteenOrder.STATUS_READY,
            delivery_person=None,
            delivery_accepted_at=None,
            updated_at=now,
        )
        released_count = assigned_orders.exclude(status__in=reopened_statuses).update(
            delivery_person=None,
            delivery_accepted_at=None,
            updated_at=now,
        )

        delivery_person_email = delivery_person.email
        delivery_person.delete()

        detail = f"Delivery person {delivery_person_email} deleted successfully."
        if reopened_count or released_count:
            detail += (
                f" {reopened_count} active delivery order(s) were moved back to ready,"
                f" and {released_count} assigned order(s) were released for reassignment."
            )

        return Response({"detail": detail})



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

    def put(self, request, user_id):
        """Update manager contact details or assignment."""
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can manage managers."}, status=status.HTTP_403_FORBIDDEN)

        try:
            manager = User.objects.select_related('staff_profile', 'role').get(
                id=user_id,
                role__role_name__in=['canteen_manager', 'mess_manager']
            )
        except User.DoesNotExist:
            return Response({"detail": "Manager not found."}, status=status.HTTP_404_NOT_FOUND)

        from .serializers import ManagerSerializer, UpdateManagerSerializer

        serializer = UpdateManagerSerializer(instance=manager, data=request.data)
        serializer.is_valid(raise_exception=True)
        manager = serializer.save()

        return Response(ManagerSerializer(manager).data)

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


class AdminMessManagementView(GenericAPIView):
    """View for admin managers to create and list messes"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all messes"""
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        from apps.mess.models import Mess
        from .serializers import MessListSerializer
        messes = sorted(Mess.objects.all(), key=lambda mess: _natural_sort_key(mess.hall_name))
        serializer = MessListSerializer(messes, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new mess for a hall"""
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can create messes."}, status=status.HTTP_403_FORBIDDEN)

        from .serializers import CreateMessSerializer
        serializer = CreateMessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        mess = serializer.save()
        return Response({
            "detail": f"Mess created successfully: {mess.name}",
            "id": mess.id,
            "name": mess.name,
            "hall_name": mess.hall_name,
            "location": mess.location,
        }, status=status.HTTP_201_CREATED)


class AdminMessDetailView(GenericAPIView):
    """View to update, toggle status, or delete a mess"""
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        from .serializers import UpdateMessSerializer, MessListSerializer
        try:
            mess = Mess.objects.get(id=pk)
        except Mess.DoesNotExist:
            return Response({"detail": "Mess not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateMessSerializer(mess, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_mess = serializer.save()
        return Response({
            "detail": f"Mess updated successfully: {updated_mess.name}",
            **MessListSerializer(updated_mess).data,
        })

    def patch(self, request, pk):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        try:
            mess = Mess.objects.get(id=pk)
            mess.is_active = not mess.is_active
            mess.save()
            return Response({"detail": f"Mess {'activated' if mess.is_active else 'frozen'} successfully.", "is_active": mess.is_active})
        except Mess.DoesNotExist:
            return Response({"detail": "Mess not found."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        try:
            mess = Mess.objects.get(id=pk)
            mess_name = mess.name
            mess.delete()
            return Response({"detail": f"Mess {mess_name} deleted successfully."})
        except Mess.DoesNotExist:
            return Response({"detail": "Mess not found."}, status=status.HTTP_404_NOT_FOUND)


class AdminCanteenManagementView(GenericAPIView):
    """View for admin managers to list and create canteens"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        from apps.canteen.models import Canteen
        from .serializers import CanteenListSerializer
        canteens = sorted(
            Canteen.objects.all(),
            key=lambda canteen: (
                not canteen.is_active,
                _natural_sort_key(canteen.name),
            ),
        )
        return Response(CanteenListSerializer(canteens, many=True).data)

    def post(self, request):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        from .serializers import CreateCanteenSerializer
        serializer = CreateCanteenSerializer(data=request.data)
        if serializer.is_valid():
            canteen = serializer.save(is_active=True)
            return Response({
                "detail": f"Canteen created successfully: {canteen.name}",
                "id": canteen.id,
                "name": canteen.name,
                "location": canteen.location,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCanteenDetailView(GenericAPIView):
    """View to toggle status or delete a canteen"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, canteen_id):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.canteen.models import Canteen
        try:
            canteen = Canteen.objects.get(id=canteen_id)
            canteen.is_active = not canteen.is_active
            canteen.save()
            return Response({"detail": f"Canteen {'activated' if canteen.is_active else 'frozen'} successfully.", "is_active": canteen.is_active})
        except Canteen.DoesNotExist:
            return Response({"detail": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, canteen_id):
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'admin_manager':
            return Response({"detail": "Only admin managers can access this."}, status=status.HTTP_403_FORBIDDEN)
        
        from apps.canteen.models import Canteen
        try:
            canteen = Canteen.objects.get(id=canteen_id)
            canteen_name = canteen.name
            canteen.delete()
            return Response({"detail": f"Canteen {canteen_name} deleted successfully."})
        except Canteen.DoesNotExist:
            return Response({"detail": "Canteen not found."}, status=status.HTTP_404_NOT_FOUND)

class AvailableHallsView(GenericAPIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        halls = sorted(
            Mess.objects.filter(is_active=True).values_list('hall_name', flat=True).distinct(),
            key=_natural_sort_key,
        )
        return Response(list(halls))


class PublicCanteensView(GenericAPIView):
    """Public endpoint to list all active canteens for the student dashboard."""
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.canteen.models import Canteen
        canteens = sorted(
            Canteen.objects.filter(is_active=True).values('id', 'name', 'location'),
            key=lambda canteen: _natural_sort_key(canteen["name"]),
        )
        return Response(list(canteens))


class MessWorkerManagementView(GenericAPIView):
    """View for mess managers to list and create mess workers"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all mess workers assigned to the same mess as this manager"""
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'mess_manager':
            return Response({"detail": "Only mess managers can access this."}, status=status.HTTP_403_FORBIDDEN)

        from apps.mess.models import MessStaffAssignment
        # Find this manager's mess
        manager_assignment = MessStaffAssignment.objects.filter(
            staff=request.user.staff_profile, assignment_role='manager', is_active=True
        ).first()
        if not manager_assignment:
            return Response({"detail": "You are not assigned to any mess."}, status=status.HTTP_403_FORBIDDEN)

        # Get all workers in the same mess
        worker_assignments = MessStaffAssignment.objects.filter(
            mess=manager_assignment.mess, assignment_role='worker'
        ).select_related('staff__user')

        worker_user_ids = [a.staff.user_id for a in worker_assignments]
        workers = User.objects.filter(id__in=worker_user_ids).select_related('staff_profile')

        from .serializers import MessWorkerSerializer
        return Response(MessWorkerSerializer(workers, many=True).data)

    def post(self, request):
        """Create a new mess worker"""
        if not hasattr(request.user, 'role') or request.user.role.role_name != 'mess_manager':
            return Response({"detail": "Only mess managers can create mess workers."}, status=status.HTTP_403_FORBIDDEN)

        from .serializers import CreateMessWorkerSerializer
        serializer = CreateMessWorkerSerializer(data=request.data, context={'mess_manager': request.user})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        return Response({
            "detail": "Mess worker created successfully.",
            "email": result['user'].email,
            "temp_password": result['temp_password'],
            "employee_code": result['employee_code'],
        }, status=status.HTTP_201_CREATED)


class MessWorkerDetailView(GenericAPIView):
    """View for mess managers to update worker details."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        worker, error = _get_managed_mess_worker(request, user_id)
        if error:
            return error

        from .serializers import MessWorkerSerializer, UpdateMessWorkerSerializer

        serializer = UpdateMessWorkerSerializer(worker, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_worker = serializer.save()

        return Response(MessWorkerSerializer(updated_worker).data, status=status.HTTP_200_OK)


class ToggleMessWorkerStatusView(GenericAPIView):
    """View for mess managers to toggle or delete mess workers"""
    permission_classes = [IsAuthenticated]

    def _get_worker(self, request, user_id):
        """Helper to validate manager and find the worker"""
        return _get_managed_mess_worker(request, user_id)

    def patch(self, request, user_id):
        """Toggle worker active status (freeze/unfreeze)"""
        worker, error = self._get_worker(request, user_id)
        if error:
            return error

        worker.is_active = not worker.is_active
        worker.save(update_fields=['is_active'])

        status_text = "activated" if worker.is_active else "frozen"
        return Response({
            "detail": f"Worker {status_text} successfully.",
            "is_active": worker.is_active
        })

    def delete(self, request, user_id):
        """Delete a mess worker account"""
        worker, error = self._get_worker(request, user_id)
        if error:
            return error

        worker_email = worker.email
        worker.delete()
        return Response({"detail": f"Worker {worker_email} deleted successfully."})
