from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User, Role, MessAccount


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True)
    role_name = serializers.ChoiceField(
        choices=Role.ROLE_CHOICES, required=False, allow_null=True
    )

    def validate_email(self, value):
        if not value.lower().endswith("@iitk.ac.in"):
            raise serializers.ValidationError("Only @iitk.ac.in emails are allowed.")
        return value.lower()

    def create(self, validated_data):
        role_name = validated_data.pop("role_name", None)
        role = None
        if role_name:
            role, _ = Role.objects.get_or_create(role_name=role_name)

        user, _ = User.objects.get_or_create(
            email=validated_data["email"], defaults={"role": role}
        )
        user.phone = validated_data.get("phone", user.phone)
        if role:
            user.role = role
        user.set_password(validated_data["password"])
        user.is_active = False
        user.is_verified = False
        user.save()
        return user


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs.get("email"), password=attrs.get("password"))
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_verified:
            raise serializers.ValidationError("Email not verified.")
        if not user.is_active:
            raise serializers.ValidationError("Account is inactive.")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "phone", "role", "is_verified", "is_active", "date_joined"]
        read_only_fields = ["email", "role", "is_verified", "is_active", "date_joined"]

    def get_role(self, obj):
        return obj.role.role_name if obj.role else None


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