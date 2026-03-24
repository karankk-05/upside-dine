from django.core.validators import MinValueValidator
from django.db import models


class CanteenOrder(models.Model):
    ORDER_TYPE_PICKUP = "pickup"
    ORDER_TYPE_DELIVERY = "delivery"
    ORDER_TYPE_PREBOOKING = "prebooking"
    ORDER_TYPE_CHOICES = [
        (ORDER_TYPE_PICKUP, "Pickup"),
        (ORDER_TYPE_DELIVERY, "Delivery"),
        (ORDER_TYPE_PREBOOKING, "Prebooking"),
    ]

    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_REJECTED = "rejected"
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_OUT_FOR_DELIVERY = "out_for_delivery"
    STATUS_DELIVERED = "delivered"
    STATUS_PICKED_UP = "picked_up"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_OUT_FOR_DELIVERY, "Out For Delivery"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_PICKED_UP, "Picked Up"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    order_number = models.CharField(max_length=32, unique=True)
    student = models.ForeignKey("users.Student", on_delete=models.CASCADE, related_name="canteen_orders")
    canteen = models.ForeignKey("canteen.Canteen", on_delete=models.CASCADE, related_name="orders")
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default=ORDER_TYPE_PICKUP)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    delivery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default=STATUS_PENDING)
    delivery_address = models.TextField(blank=True)
    estimated_ready_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    pickup_qr_code = models.CharField(max_length=80, blank=True)
    pickup_otp = models.CharField(max_length=6, blank=True)
    cancellation_reason = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "-created_at"]),
            models.Index(fields=["canteen", "status"]),
            models.Index(fields=["order_number"]),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.student.full_name}"


class CanteenOrderItem(models.Model):
    order = models.ForeignKey(CanteenOrder, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey("canteen.CanteenMenuItem", on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    special_instructions = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.order.order_number} - {self.menu_item.item_name} x {self.quantity}"
