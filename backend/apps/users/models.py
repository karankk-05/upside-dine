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
        ("admin_manager", "Admin Manager"),
    ]

    role_name = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.role_name


class EmployeeCode(models.Model):
    """Pre-generated employee codes for manager verification"""
    code = models.CharField(max_length=50, unique=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="employee_codes")
    is_claimed = models.BooleanField(default=False)
    claimed_by = models.ForeignKey(
        "User", null=True, blank=True, on_delete=models.SET_NULL, related_name="claimed_code"
    )
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.role.role_name} ({'Claimed' if self.is_claimed else 'Available'})"

    class Meta:
        indexes = [
            models.Index(fields=["code", "is_claimed"]),
        ]


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
    canteen = models.ForeignKey(
        "canteen.Canteen", null=True, blank=True, on_delete=models.SET_NULL, related_name="staff_members"
    )
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

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Staff)
def auto_assign_mess_manager(sender, instance, created, **kwargs):
    if created and instance.user.role and instance.user.role.role_name == "mess_manager":
        from apps.mess.models import Mess, MessStaffAssignment
        
        # Give each new manager their own dedicated mess to avoid collisions
        mess, _ = Mess.objects.get_or_create(
            name=f"Mess of {instance.full_name}", 
            defaults={
                "location": "Main Campus", 
                "hall_name": f"Hall {instance.employee_code}", 
                "is_active": True
            }
        )
        MessStaffAssignment.objects.get_or_create(
            staff=instance,
            mess=mess,
            assignment_role="manager",
            defaults={"is_active": True}
        )