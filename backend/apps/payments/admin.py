from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "razorpay_order_id",
        "razorpay_payment_id",
        "amount",
        "currency",
        "status",
        "refund_amount",
        "captured_at",
        "refunded_at",
    )
    list_filter = ("status", "currency")
    search_fields = ("order__order_number", "razorpay_order_id", "razorpay_payment_id")
    readonly_fields = ("raw_response", "created_at", "updated_at")
