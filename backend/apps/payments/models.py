from django.core.validators import MinValueValidator
from django.db import models


class Payment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_AUTHORIZED = "authorized"
    STATUS_CAPTURED = "captured"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_AUTHORIZED, "Authorized"),
        (STATUS_CAPTURED, "Captured"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    order = models.OneToOneField("orders.CanteenOrder", on_delete=models.CASCADE, related_name="payment")
    razorpay_order_id = models.CharField(max_length=120, blank=True, unique=True, null=True)
    razorpay_payment_id = models.CharField(max_length=120, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=256, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=8, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    payment_method = models.CharField(max_length=40, blank=True)
    failure_reason = models.TextField(blank=True)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    refunded_at = models.DateTimeField(null=True, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"
