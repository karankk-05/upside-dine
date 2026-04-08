from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User, Role, Student, Staff, MessAccount
from apps.mess.models import Mess, MessStaffAssignment


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True)
    role_name = serializers.ChoiceField(
        choices=Role.ROLE_CHOICES, required=False, allow_null=True
    )
    full_name = serializers.CharField(required=False, allow_blank=True)
    roll_number = serializers.CharField(required=False, allow_blank=True)
    hostel_name = serializers.CharField(required=False, allow_blank=True)
    room_number = serializers.CharField(required=False, allow_blank=True)
    employee_code = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower()
        role_name = self.initial_data.get("role_name")
        if role_name == "student" and not value.endswith("@iitk.ac.in"):
            raise serializers.ValidationError("Students must register with an @iitk.ac.in email address.")
        if User.objects.filter(email=value, is_verified=True).exists():
            raise serializers.ValidationError("A verified account with this email already exists.")
        return value

    def create(self, validated_data):
        role_name = validated_data.pop("role_name", None)
        role = None
        if role_name:
            role, _ = Role.objects.get_or_create(role_name=role_name)

        user, created = User.objects.get_or_create(
            email=validated_data["email"], defaults={"role": role}
        )
        user.phone = validated_data.get("phone", user.phone)
        if role:
            user.role = role
        user.set_password(validated_data["password"])
        user.is_active = False
        user.is_verified = False
        user.save()

        # Create role-specific profiles
        if role and role.role_name == "student":
            roll_number = validated_data.get("roll_number") or validated_data["email"].split("@")[0]
            full_name = validated_data.get("full_name") or validated_data["email"].split("@")[0]
            student, student_created = Student.objects.get_or_create(
                user=user,
                defaults={
                    "roll_number": roll_number,
                    "full_name": full_name,
                    "hostel_name": validated_data.get("hostel_name", ""),
                    "room_number": validated_data.get("room_number", ""),
                },
            )
            if student_created:
                MessAccount.objects.get_or_create(student=student)
                # Auto-assign student to the mess matching their hall
                hostel = validated_data.get("hostel_name", "")
                if hostel:
                    mess = Mess.objects.filter(hall_name=hostel, is_active=True).first()
                    # Mess may not exist yet; assignment happens when it does

        elif role and role.role_name in ["mess_manager", "mess_worker", "canteen_manager", "delivery_person"]:
            employee_code = validated_data.get("employee_code") or f"EMP-{user.id}"
            full_name = validated_data.get("full_name") or validated_data["email"].split("@")[0]
            Staff.objects.get_or_create(
                user=user,
                defaults={
                    "employee_code": employee_code,
                    "full_name": full_name,
                    "is_mess_staff": role.role_name in ["mess_manager", "mess_worker"],
                },
            )

        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        user = authenticate(email=email, password=attrs.get("password"))
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_verified:
            raise serializers.ValidationError("Email not verified.")
        if not user.is_active:
            raise serializers.ValidationError("Account is inactive.")
        attrs["user"] = user
        return attrs


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ["roll_number", "full_name", "hostel_name", "room_number"]
        read_only_fields = fields


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ["full_name", "employee_code", "canteen", "is_mess_staff"]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "phone", "role", "is_verified", "is_active", "is_superuser", "date_joined", "profile"]
        read_only_fields = ["email", "role", "is_verified", "is_active", "is_superuser", "date_joined"]

    def get_role(self, obj):
        if obj.is_superuser:
            return "superadmin"
        return obj.role.role_name if obj.role else None

    def get_profile(self, obj):
        if hasattr(obj, "student_profile"):
            return StudentProfileSerializer(obj.student_profile).data
        if hasattr(obj, "staff_profile"):
            return StaffProfileSerializer(obj.staff_profile).data
        return None


class UserProfileUpdateSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    full_name = serializers.CharField(required=False, max_length=100)
    hostel_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    room_number = serializers.CharField(required=False, allow_blank=True, max_length=20)

    def validate(self, attrs):
        allowed_fields = set(self.fields.keys())
        unknown_fields = set(self.initial_data.keys()) - allowed_fields
        if unknown_fields:
            raise serializers.ValidationError(
                {field: ["This field cannot be updated."] for field in sorted(unknown_fields)}
            )

        if not attrs:
            raise serializers.ValidationError("Provide at least one field to update.")

        user = self.instance
        student_only_fields = {"hostel_name", "room_number"}

        if hasattr(user, "student_profile"):
            return attrs

        unsupported_fields = [field for field in student_only_fields if field in attrs]
        if unsupported_fields:
            raise serializers.ValidationError(
                {field: ["This field is only available for student accounts."] for field in unsupported_fields}
            )

        return attrs

    def update(self, instance, validated_data):
        user_fields = []
        phone = validated_data.get("phone")
        if phone is not None:
            instance.phone = phone
            user_fields.append("phone")

        if user_fields:
            instance.save(update_fields=user_fields)

        if hasattr(instance, "student_profile"):
            profile = instance.student_profile
            profile_fields = []
            for field in ("full_name", "hostel_name", "room_number"):
                if field in validated_data:
                    setattr(profile, field, validated_data[field])
                    profile_fields.append(field)
            if profile_fields:
                profile.save(update_fields=profile_fields)
        elif hasattr(instance, "staff_profile") and "full_name" in validated_data:
            profile = instance.staff_profile
            profile.full_name = validated_data["full_name"]
            profile.save(update_fields=["full_name"])

        return instance


class MessAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessAccount
        fields = ["balance", "last_updated"]
        read_only_fields = ["balance", "last_updated"]


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)



class CreateDeliveryPersonSerializer(serializers.Serializer):
    """Serializer for canteen manager to create delivery personnel"""
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def create(self, validated_data):
        import secrets
        import string
        from django.core.mail import send_mail
        from django.conf import settings

        # Generate secure temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

        # Get delivery person role
        role, _ = Role.objects.get_or_create(role_name='delivery_person')

        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=temp_password,
            phone=validated_data['phone'],
            role=role,
            is_verified=True,
            is_active=True,
        )

        # Generate unique employee code
        employee_code = f"DEL{secrets.token_hex(4).upper()}"
        while Staff.objects.filter(employee_code=employee_code).exists():
            employee_code = f"DEL{secrets.token_hex(4).upper()}"

        # Get canteen manager's canteen from request context
        canteen_manager = self.context.get('canteen_manager')
        canteen = canteen_manager.staff_profile.canteen if canteen_manager and hasattr(canteen_manager, 'staff_profile') else None

        # Create staff profile
        Staff.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            employee_code=employee_code,
            canteen=canteen,
            is_mess_staff=False,
        )

        # Send email with credentials
        try:
            send_mail(
                subject='Your Delivery Personnel Account - Upside Dine',
                message=f'''Hello {validated_data['full_name']},

Your delivery personnel account has been created.

Login Credentials:
Email: {validated_data['email']}
Temporary Password: {temp_password}

Please login and change your password immediately.

Login at: {settings.CORS_ALLOWED_ORIGINS.split(',')[0] if settings.CORS_ALLOWED_ORIGINS else 'http://localhost:3000'}/auth

Best regards,
Upside Dine Team''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[validated_data['email']],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail the creation
            print(f"Failed to send email: {e}")

        return {
            'user': user,
            'temp_password': temp_password,
            'employee_code': employee_code,
        }


class DeliveryPersonSerializer(serializers.ModelSerializer):
    """Serializer for listing delivery personnel"""
    full_name = serializers.CharField(source='staff_profile.full_name', read_only=True)
    employee_code = serializers.CharField(source='staff_profile.employee_code', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'full_name', 'employee_code', 'is_active', 'date_joined']
        read_only_fields = fields



class CreateManagerSerializer(serializers.Serializer):
    """Serializer for admin manager to create canteen/mess managers"""
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    role_name = serializers.ChoiceField(choices=['canteen_manager', 'mess_manager'])
    canteen_id = serializers.IntegerField(required=False, allow_null=True)
    mess_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value

    def validate(self, attrs):
        role = attrs.get('role_name')
        if role == 'canteen_manager' and not attrs.get('canteen_id'):
            raise serializers.ValidationError({"canteen_id": "Canteen is required for canteen managers."})
        if role == 'mess_manager' and not attrs.get('mess_id'):
            raise serializers.ValidationError({"mess_id": "Mess is required for mess managers."})
        return attrs

    def create(self, validated_data):
        import secrets
        import string
        from django.core.mail import send_mail
        from django.conf import settings
        from apps.mess.models import MessStaffAssignment

        # Generate secure temporary password
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

        # Get role
        role, _ = Role.objects.get_or_create(role_name=validated_data['role_name'])

        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=temp_password,
            phone=validated_data['phone'],
            role=role,
            is_verified=True,
            is_active=True,
        )

        # Generate unique employee code
        employee_code = f"{validated_data['role_name'].upper()[:3]}{secrets.token_hex(4).upper()}"
        while Staff.objects.filter(employee_code=employee_code).exists():
            employee_code = f"{validated_data['role_name'].upper()[:3]}{secrets.token_hex(4).upper()}"

        staff = Staff.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            employee_code=employee_code,
            canteen_id=validated_data.get('canteen_id') if validated_data['role_name'] == 'canteen_manager' else None,
            is_mess_staff=(validated_data['role_name'] == 'mess_manager'),
        )

        # If mess manager, create the MessStaffAssignment
        if validated_data['role_name'] == 'mess_manager' and validated_data.get('mess_id'):
            MessStaffAssignment.objects.create(
                staff=staff,
                mess_id=validated_data['mess_id'],
                assignment_role='manager',
                is_active=True,
            )

        # Send email with credentials
        try:
            subject = f'Your {role.get_role_name_display()} Account - Upside Dine'
            message = f'''Hello {validated_data['full_name']},

Your {role.get_role_name_display()} account has been created.

Login Credentials:
==================
Email: {validated_data['email']}
Temporary Password: {temp_password}
Employee Code: {employee_code}

Login URL: http://localhost:3000/auth

IMPORTANT: Please change your password immediately after your first login.

Best regards,
Upside Dine Team'''
            
            from_email = settings.DEFAULT_FROM_EMAIL
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[validated_data['email']],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't fail the creation
            print(f"Failed to send email: {e}")

        return {
            'user': user,
            'temp_password': temp_password,
            'employee_code': employee_code,
        }


class ManagerSerializer(serializers.ModelSerializer):
    """Serializer for listing managers"""
    full_name = serializers.CharField(source='staff_profile.full_name', read_only=True)
    employee_code = serializers.CharField(source='staff_profile.employee_code', read_only=True)
    canteen_id = serializers.IntegerField(source='staff_profile.canteen_id', read_only=True)
    role_name = serializers.CharField(source='role.role_name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'full_name', 'employee_code', 'canteen_id', 'role_name', 'is_active', 'date_joined']
        read_only_fields = fields


class CreateMessSerializer(serializers.Serializer):
    """Serializer for admin manager to create a mess for a hall"""
    hall_name = serializers.CharField()

    def validate_hall_name(self, value):
        if Mess.objects.filter(hall_name=value).exists():
            raise serializers.ValidationError(f"A mess for {value} already exists.")
        return value

    def create(self, validated_data):
        mess = Mess.objects.create(
            hall_name=validated_data['hall_name'],
        )
        return mess


class MessListSerializer(serializers.ModelSerializer):
    """Serializer for listing messes"""
    hall_display = serializers.SerializerMethodField()

    class Meta:
        model = Mess
        fields = ['id', 'name', 'hall_name', 'hall_display', 'is_active', 'created_at']
        read_only_fields = fields

    def get_hall_display(self, obj):
        return obj.hall_name

class CanteenListSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.canteen.models import Canteen
        model = Canteen
        fields = ['id', 'name', 'location', 'is_active']

class CreateCanteenSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.canteen.models import Canteen
        model = Canteen
        fields = ['name', 'location', 'is_active']
        read_only_fields = ['is_active']


class MessWorkerSerializer(serializers.ModelSerializer):
    """Serializer for listing mess workers"""
    full_name = serializers.CharField(source='staff_profile.full_name', read_only=True)
    employee_code = serializers.CharField(source='staff_profile.employee_code', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'full_name', 'employee_code', 'is_active', 'date_joined']
        read_only_fields = fields


class CreateMessWorkerSerializer(serializers.Serializer):
    """Serializer for mess managers to create mess workers"""
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        import secrets
        from django.conf import settings
        from django.core.mail import send_mail

        # Get the mess manager's mess assignment
        mess_manager = self.context['mess_manager']
        manager_staff = mess_manager.staff_profile
        assignment = MessStaffAssignment.objects.filter(
            staff=manager_staff, assignment_role='manager', is_active=True
        ).select_related('mess').first()

        if not assignment:
            raise serializers.ValidationError("You are not assigned to any mess.")

        mess = assignment.mess

        # Create role
        role, _ = Role.objects.get_or_create(role_name='mess_worker')

        # Generate temp password
        temp_password = secrets.token_urlsafe(10)

        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=temp_password,
            phone=validated_data['phone'],
            role=role,
            is_verified=True,
            is_active=True,
        )

        # Generate employee code
        employee_code = f"MWK{secrets.token_hex(4).upper()}"
        while Staff.objects.filter(employee_code=employee_code).exists():
            employee_code = f"MWK{secrets.token_hex(4).upper()}"

        staff = Staff.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            employee_code=employee_code,
            is_mess_staff=True,
        )

        # Create mess staff assignment as worker
        MessStaffAssignment.objects.create(
            staff=staff,
            mess=mess,
            assignment_role='worker',
            is_active=True,
        )

        # Send email with credentials
        try:
            subject = 'Your Mess Worker Account - Upside Dine'
            message = f'''Hello {validated_data['full_name']},

Your Mess Worker account for {mess.name} has been created.

Login Credentials:
==================
Email: {validated_data['email']}
Temporary Password: {temp_password}
Employee Code: {employee_code}

Login URL: http://localhost:3000/auth

IMPORTANT: Please change your password immediately after your first login.

Best regards,
Upside Dine Team'''

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[validated_data['email']],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

        return {
            'user': user,
            'temp_password': temp_password,
            'employee_code': employee_code,
        }
