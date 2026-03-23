from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Canteen(models.Model):
    name = models.CharField(max_length=120, unique=True)
    location = models.CharField(max_length=200)
    contact_phone = models.CharField(max_length=20, blank=True)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_delivery_available = models.BooleanField(default=True)
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    is_active = models.BooleanField(default=True)
    rating = models.FloatField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class CanteenMenuCategory(models.Model):
    canteen = models.ForeignKey(Canteen, on_delete=models.CASCADE, related_name="categories")
    category_name = models.CharField(max_length=80)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "category_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["canteen", "category_name"], name="uniq_canteen_category_name"
            )
        ]

    def __str__(self):
        return f"{self.canteen.name} - {self.category_name}"


class CanteenMenuItem(models.Model):
    canteen = models.ForeignKey(Canteen, on_delete=models.CASCADE, related_name="menu_items")
    category = models.ForeignKey(
        CanteenMenuCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="menu_items",
    )
    item_name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    preparation_time_mins = models.PositiveSmallIntegerField(default=10)
    is_veg = models.BooleanField(default=True)
    is_available = models.BooleanField(default=True)
    available_quantity = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["item_name"]
        indexes = [
            models.Index(fields=["canteen", "is_active", "is_available"]),
            models.Index(fields=["is_veg"]),
        ]

    def __str__(self):
        return f"{self.item_name} ({self.canteen.name})"
