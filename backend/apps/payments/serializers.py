from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order_id",
            "order_number",
            "razorpay_order_id",
            "razorpay_payment_id",
            "amount",
            "currency",
            "status",
            "payment_method",
            "failure_reason",
            "refund_amount",
            "refunded_at",
            "captured_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PaymentCreateOrderSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()


class PaymentVerifySerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=120)
    razorpay_payment_id = serializers.CharField(max_length=120)
    razorpay_signature = serializers.CharField(max_length=256)


class PaymentRefundSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, min_value=0.01)
