from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class Role(models.Model):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("mess_manager", "Mess Manager"),
        ("mess_worker", "Mess Worker"),
        ("canteen_manager", "Canteen Manager"),
        ("delivery_person", "Delivery Person"),
    ]

    role_name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.role_name


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.ForeignKey(Role, null=True, blank=True, on_delete=models.SET_NULL)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    roll_number = models.CharField(max_length=30, unique=True)
    full_name = models.CharField(max_length=100)
    hostel_name = models.CharField(max_length=100, blank=True)
    room_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.full_name


class Staff(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    full_name = models.CharField(max_length=100)
    employee_code = models.CharField(max_length=50, unique=True)
    canteen_id = models.IntegerField(null=True, blank=True)
    is_mess_staff = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name


class MessAccount(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="mess_account")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.full_name} - {self.balance}"


class UserToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tokens")
    refresh_token = models.TextField()
    device_info = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.created_at}"