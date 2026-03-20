from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User, Role, Student, Staff, MessAccount


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
        fields = ["full_name", "employee_code", "canteen_id", "is_mess_staff"]
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