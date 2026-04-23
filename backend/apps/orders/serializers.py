from rest_framework import serializers

from apps.canteen.serializers import CanteenListSerializer

from .models import CanteenOrder, CanteenOrderItem


class OrderItemInputSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    special_instructions = serializers.CharField(required=False, allow_blank=True, max_length=250)


class PlaceOrderSerializer(serializers.Serializer):
    canteen_id = serializers.IntegerField()
    order_type = serializers.ChoiceField(choices=CanteenOrder.ORDER_TYPE_CHOICES, default=CanteenOrder.ORDER_TYPE_PICKUP)
    payment_method = serializers.ChoiceField(
        choices=[("cash", "Cash"), ("razorpay", "Razorpay")],
        default="cash",
        required=False,
    )
    scheduled_time = serializers.DateTimeField(required=False, allow_null=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemInputSerializer(many=True, min_length=1)


class CanteenOrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.item_name", read_only=True)

    class Meta:
        model = CanteenOrderItem
        fields = [
            "id",
            "menu_item",
            "menu_item_name",
            "quantity",
            "unit_price",
            "total_price",
            "special_instructions",
        ]


class CanteenOrderSerializer(serializers.ModelSerializer):
    canteen = CanteenListSerializer(read_only=True)
    items = CanteenOrderItemSerializer(many=True, read_only=True)
    status_timeline = serializers.SerializerMethodField()
    delivery_person_name = serializers.SerializerMethodField()
    delivery_person_phone = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = CanteenOrder
        fields = [
            "id",
            "order_number",
            "canteen",
            "order_type",
            "scheduled_time",
            "subtotal",
            "delivery_fee",
            "total_amount",
            "status",
            "delivery_address",
            "estimated_ready_time",
            "notes",
            "pickup_qr_code",
            "pickup_otp",
            "created_at",
            "updated_at",
            "items",
            "status_timeline",
            "delivery_person_name",
            "delivery_person_phone",
            "payment_status",
        ]

    def get_delivery_person_name(self, obj):
        if obj.delivery_person:
            if hasattr(obj.delivery_person, "staff_profile"):
                return obj.delivery_person.staff_profile.full_name
            return obj.delivery_person.email
        return None

    def get_delivery_person_phone(self, obj):
        if obj.delivery_person:
            return getattr(obj.delivery_person, "phone_number", None) or ""
        return None

    def get_status_timeline(self, obj):
        return [
            {"status": "pending", "timestamp": obj.created_at},
            {"status": obj.status, "timestamp": obj.updated_at},
        ]

    def get_payment_status(self, obj):
        if not hasattr(obj, "payment") or not obj.payment:
            return "not_required"
        return obj.payment.status


class CanteenOrderListSerializer(serializers.ModelSerializer):
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = CanteenOrder
        fields = [
            "id",
            "order_number",
            "canteen_name",
            "order_type",
            "total_amount",
            "status",
            "payment_status",
            "estimated_ready_time",
            "created_at",
        ]

    def get_payment_status(self, obj):
        if not hasattr(obj, "payment") or not obj.payment:
            return "not_required"
        return obj.payment.status


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = CanteenOrder
        fields = ["id", "order_number", "status", "estimated_ready_time", "updated_at"]
        read_only_fields = fields


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=250)


class ManagerOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=CanteenOrder.STATUS_CHOICES)
    estimated_ready_time = serializers.DateTimeField(required=False, allow_null=True)


class PickupVerifySerializer(serializers.Serializer):
    pickup_otp = serializers.CharField(required=False, allow_blank=True, max_length=6)
    pickup_qr_code = serializers.CharField(required=False, allow_blank=True, max_length=80)

    def validate(self, attrs):
        if not attrs.get("pickup_otp") and not attrs.get("pickup_qr_code"):
            raise serializers.ValidationError("Either pickup_otp or pickup_qr_code is required.")
        return attrs
