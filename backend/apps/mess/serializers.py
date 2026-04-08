from decimal import Decimal

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from apps.users.models import MessAccount, Staff

from .models import Mess, MessBooking, MessMenuItem
from .services import (
    BookingExpiredError,
    BookingStateError,
    BookingValidationError,
    InsufficientBalanceError,
    InsufficientStockError,
    build_booking_qr_payload,
    cancel_booking,
    create_booking,
    get_booking_by_qr_code,
    redeem_booking,
    validate_booking_request,
)


def _get_student_from_context(context):
    student = context.get("student")
    if student is not None:
        return student

    request = context.get("request")
    if request and getattr(request, "user", None) and request.user.is_authenticated:
        student = getattr(request.user, "student_profile", None)
        if student is not None:
            return student

    raise serializers.ValidationError("Student context is required for this operation.")


def _get_staff_from_context(context):
    staff = context.get("staff")
    if staff is not None:
        return staff

    request = context.get("request")
    if request and getattr(request, "user", None) and request.user.is_authenticated:
        staff = getattr(request.user, "staff_profile", None)
        if staff is not None:
            return staff

    raise serializers.ValidationError("Staff context is required for this operation.")


class MessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mess
        fields = ("id", "name", "location", "hall_name", "is_active")
        read_only_fields = ("id",)


class MessMenuItemSerializer(serializers.ModelSerializer):
    mess_name = serializers.CharField(source="mess.name", read_only=True)

    class Meta:
        model = MessMenuItem
        fields = (
            "id",
            "mess",
            "mess_name",
            "item_name",
            "description",
            "price",
            "meal_type",
            "day_of_week",
            "available_quantity",
            "default_quantity",
            "image_url",
            "is_active",
        )
        read_only_fields = ("id", "mess_name")


class MessMenuItemCreateUpdateSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"))
    available_quantity = serializers.IntegerField(min_value=0)
    default_quantity = serializers.IntegerField(min_value=0)

    class Meta:
        model = MessMenuItem
        fields = (
            "id",
            "mess",
            "item_name",
            "description",
            "price",
            "meal_type",
            "day_of_week",
            "available_quantity",
            "default_quantity",
            "image_url",
            "is_active",
        )
        read_only_fields = ("id",)

    def validate_item_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Item name cannot be blank.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        instance = getattr(self, "instance", None)
        mess = attrs.get("mess") or getattr(instance, "mess", None)
        item_name = attrs.get("item_name") or getattr(instance, "item_name", None)
        meal_type = attrs.get("meal_type") or getattr(instance, "meal_type", None)
        day_of_week = attrs.get("day_of_week") or getattr(instance, "day_of_week", None)

        if not all([mess, item_name, meal_type, day_of_week]):
            return attrs

        conflicting_items = MessMenuItem.objects.filter(
            mess=mess,
            item_name=item_name,
            meal_type=meal_type,
            day_of_week=day_of_week,
        )
        if instance is not None:
            conflicting_items = conflicting_items.exclude(pk=instance.pk)

        if conflicting_items.exists():
            raise serializers.ValidationError(
                {
                    "detail": (
                        f'An extra named "{item_name}" already exists for '
                        f"{day_of_week.replace('_', ' ').title()} {meal_type}."
                    )
                }
            )

        return attrs


class MessBookingCreateSerializer(serializers.Serializer):
    menu_item = serializers.PrimaryKeyRelatedField(queryset=MessMenuItem.objects.select_related("mess").all())
    quantity = serializers.IntegerField(min_value=1)
    meal_type = serializers.ChoiceField(
        choices=MessMenuItem.MealType.choices,
        required=False,
        allow_null=True,
    )
    mess_id = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        student = _get_student_from_context(self.context)
        menu_item = attrs["menu_item"]
        quantity = attrs["quantity"]
        requested_meal_type = attrs.get("meal_type")
        requested_mess_id = attrs.get("mess_id")

        if not menu_item.is_active:
            raise serializers.ValidationError({"menu_item": "Selected menu item is inactive."})

        if requested_mess_id is not None and menu_item.mess_id != requested_mess_id:
            raise serializers.ValidationError(
                {"mess_id": "Provided mess_id does not match the selected menu item's mess."}
            )

        if requested_meal_type is not None and requested_meal_type != menu_item.meal_type:
            raise serializers.ValidationError(
                {"meal_type": "Requested meal_type does not match selected menu item."}
            )

        try:
            total = validate_booking_request(student, menu_item, quantity)
        except (BookingValidationError, InsufficientStockError, InsufficientBalanceError) as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc

        attrs["student"] = student
        attrs["total_price"] = total
        return attrs

    def create(self, validated_data):
        student = validated_data["student"]
        menu_item = validated_data["menu_item"]
        quantity = validated_data["quantity"]
        try:
            return create_booking(student, menu_item.id, quantity)
        except (BookingValidationError, InsufficientStockError, InsufficientBalanceError) as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc


class MessMenuItemBriefSerializer(serializers.ModelSerializer):
    mess_name = serializers.CharField(source="mess.name", read_only=True)

    class Meta:
        model = MessMenuItem
        fields = (
            "id",
            "mess",
            "mess_name",
            "item_name",
            "price",
            "meal_type",
            "day_of_week",
            "image_url",
        )


class StaffBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ("id", "full_name", "employee_code")


class MessBookingListSerializer(serializers.ModelSerializer):
    menu_item = MessMenuItemBriefSerializer(read_only=True)
    booking_reference = serializers.SerializerMethodField()

    class Meta:
        model = MessBooking
        fields = (
            "id",
            "menu_item",
            "quantity",
            "total_price",
            "meal_type",
            "booking_date",
            "status",
            "qr_expires_at",
            "created_at",
            "booking_reference",
        )

    def get_booking_reference(self, obj):
        try:
            from django.utils import timezone
            date_str = timezone.localtime(obj.created_at).strftime("%y%m%d")
            return f"BKG{date_str}{obj.id:04d}"
        except Exception:
            return f"BKG{obj.id:06d}"


class MessBookingDetailSerializer(serializers.ModelSerializer):
    menu_item = MessMenuItemSerializer(read_only=True)
    redeemed_by_staff = StaffBriefSerializer(read_only=True)
    qr_payload = serializers.SerializerMethodField()
    booking_reference = serializers.SerializerMethodField()

    class Meta:
        model = MessBooking
        fields = (
            "id",
            "menu_item",
            "quantity",
            "total_price",
            "meal_type",
            "booking_date",
            "status",
            "qr_code",
            "qr_generated_at",
            "qr_expires_at",
            "qr_payload",
            "redeemed_at",
            "redeemed_by_staff",
            "created_at",
            "updated_at",
            "booking_reference",
        )

    def get_qr_payload(self, obj):
        return build_booking_qr_payload(obj)

    def get_booking_reference(self, obj):
        try:
            from django.utils import timezone
            date_str = timezone.localtime(obj.created_at).strftime("%y%m%d")
            return f"BKG{date_str}{obj.id:04d}"
        except Exception:
            return f"BKG{obj.id:06d}"


class MessBookingCancelSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField(required=False, min_value=1, write_only=True)
    refund = serializers.BooleanField(required=False, default=True)
    restore_inventory = serializers.BooleanField(required=False, default=True)

    def save(self, **kwargs):
        booking = kwargs.get("booking")
        if booking is None:
            booking_id = kwargs.get("booking_id", self.validated_data.get("booking_id"))
            if booking_id is None:
                raise serializers.ValidationError({"booking_id": "booking_id is required."})
            try:
                booking = MessBooking.objects.get(pk=booking_id)
            except MessBooking.DoesNotExist as exc:
                raise serializers.ValidationError({"booking_id": "Booking not found."}) from exc

        student = kwargs.get("student")
        if student is None:
            student = _get_student_from_context(self.context)

        refund = kwargs.get("refund", self.validated_data.get("refund", True))
        restore_inventory = kwargs.get(
            "restore_inventory",
            self.validated_data.get("restore_inventory", True),
        )

        try:
            return cancel_booking(
                booking.id,
                student=student,
                refund=refund,
                restore_inventory=restore_inventory,
            )
        except (BookingStateError, BookingExpiredError, BookingValidationError) as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc


class MessWorkerVerifySerializer(serializers.Serializer):
    qr_code = serializers.CharField(required=False)
    booking_id = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        qr_code = attrs.get("qr_code")
        booking_id = attrs.get("booking_id")

        if not qr_code and not booking_id:
            raise serializers.ValidationError("Provide either qr_code or booking_id.")
        if qr_code and booking_id:
            raise serializers.ValidationError("Provide only one of qr_code or booking_id.")
        return attrs

    def _resolve_booking(self):
        qr_code = self.validated_data.get("qr_code")
        booking_id = self.validated_data.get("booking_id")

        if qr_code:
            try:
                return get_booking_by_qr_code(qr_code, for_update=False)
            except BookingStateError as exc:
                raise serializers.ValidationError({"qr_code": str(exc)}) from exc

        try:
            return MessBooking.objects.select_related("student", "menu_item").get(pk=booking_id)
        except ObjectDoesNotExist as exc:
            raise serializers.ValidationError({"booking_id": "Booking not found."}) from exc

    def get_booking(self):
        booking = self._resolve_booking()
        allowed_mess_id = self.context.get("allowed_mess_id")
        if allowed_mess_id is not None and booking.menu_item.mess_id != allowed_mess_id:
            raise serializers.ValidationError({"detail": "Booking does not belong to worker's assigned mess."})
        return booking

    def save(self, **kwargs):
        booking = self.get_booking()
        staff = kwargs.get("staff")
        if staff is None:
            staff = _get_staff_from_context(self.context)

        try:
            return redeem_booking(
                booking.id,
                staff=staff,
                qr_code=self.validated_data.get("qr_code"),
            )
        except (BookingStateError, BookingExpiredError, BookingValidationError) as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc


class MessInventoryUpdateSerializer(serializers.ModelSerializer):
    available_quantity = serializers.IntegerField(required=False, min_value=0)
    default_quantity = serializers.IntegerField(required=False, min_value=0)

    class Meta:
        model = MessMenuItem
        fields = ("available_quantity", "default_quantity")

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one inventory field must be provided.")
        return attrs
