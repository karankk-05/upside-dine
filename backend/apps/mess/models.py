from datetime import timedelta

from django.db import models
from django.db.models import Q
from django.utils import timezone


# ── Hall names are now dynamic and not constrained to a predefined list ──

def default_qr_expiry():
    # Valid until end of current day (11:59:59 PM local time)
    now = timezone.localtime(timezone.now())
    return now.replace(hour=23, minute=59, second=59, microsecond=999999)


class Mess(models.Model):
    name = models.CharField(max_length=120)
    location = models.CharField(max_length=255, blank=True)
    hall_name = models.CharField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        # Auto-derive mess name from hall name
        self.name = f"{self.hall_name} Mess"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.hall_name})"


class MessMenuItem(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"

    class DayOfWeek(models.TextChoices):
        MONDAY = "monday", "Monday"
        TUESDAY = "tuesday", "Tuesday"
        WEDNESDAY = "wednesday", "Wednesday"
        THURSDAY = "thursday", "Thursday"
        FRIDAY = "friday", "Friday"
        SATURDAY = "saturday", "Saturday"
        SUNDAY = "sunday", "Sunday"

    mess = models.ForeignKey(Mess, on_delete=models.CASCADE, related_name="menu_items")
    item_name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    meal_type = models.CharField(max_length=20, choices=MealType.choices)
    day_of_week = models.CharField(max_length=20, choices=DayOfWeek.choices)
    available_quantity = models.PositiveIntegerField(default=0)
    default_quantity = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["mess__name", "day_of_week", "meal_type", "item_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["mess", "item_name", "meal_type", "day_of_week"],
                name="uq_mess_menuitem_per_mess_day_meal_name",
            ),
            models.CheckConstraint(
                check=Q(available_quantity__gte=0),
                name="ck_mess_menuitem_available_qty_non_negative",
            ),
            models.CheckConstraint(
                check=Q(default_quantity__gte=0),
                name="ck_mess_menuitem_default_qty_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.item_name} - {self.mess.name} ({self.day_of_week}/{self.meal_type})"


class MessBooking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        REDEEMED = "redeemed", "Redeemed"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    student = models.ForeignKey("users.Student", on_delete=models.PROTECT, related_name="mess_bookings")
    menu_item = models.ForeignKey(MessMenuItem, on_delete=models.PROTECT, related_name="bookings")
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    meal_type = models.CharField(max_length=20, choices=MessMenuItem.MealType.choices)
    booking_date = models.DateField(default=timezone.localdate)
    qr_code = models.CharField(max_length=100, unique=True, db_index=True)
    qr_generated_at = models.DateTimeField(default=timezone.now)
    qr_expires_at = models.DateTimeField(default=default_qr_expiry)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    redeemed_by_staff = models.ForeignKey(
        "users.Staff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="redeemed_mess_bookings",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(check=Q(quantity__gt=0), name="ck_mess_booking_quantity_positive"),
            models.CheckConstraint(check=Q(total_price__gte=0), name="ck_mess_booking_total_non_negative"),
        ]

    def __str__(self):
        return f"Booking #{self.id} - {self.student.full_name} - {self.status}"


class MessStaffAssignment(models.Model):
    class AssignmentRole(models.TextChoices):
        MANAGER = "manager", "Manager"
        WORKER = "worker", "Worker"

    staff = models.ForeignKey("users.Staff", on_delete=models.CASCADE, related_name="mess_assignments")
    mess = models.ForeignKey(Mess, on_delete=models.CASCADE, related_name="staff_assignments")
    assignment_role = models.CharField(max_length=20, choices=AssignmentRole.choices)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["mess__name", "assignment_role", "staff__full_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "mess", "assignment_role"],
                name="uq_mess_staff_assignment_role",
            )
        ]

    def __str__(self):
        return f"{self.staff.full_name} - {self.mess.name} ({self.assignment_role})"
