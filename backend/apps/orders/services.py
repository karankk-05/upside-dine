from datetime import timedelta
from decimal import Decimal
import secrets
import uuid

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.canteen.models import Canteen, CanteenMenuItem, CanteenPaymentConfig

from .models import CanteenOrder, CanteenOrderItem


ALLOWED_STATUS_TRANSITIONS = {
    CanteenOrder.STATUS_PENDING: {
        CanteenOrder.STATUS_CONFIRMED,
        CanteenOrder.STATUS_REJECTED,
        CanteenOrder.STATUS_CANCELLED,
    },
    CanteenOrder.STATUS_CONFIRMED: {
        CanteenOrder.STATUS_PREPARING,
        CanteenOrder.STATUS_CANCELLED,
    },
    CanteenOrder.STATUS_PREPARING: {
        CanteenOrder.STATUS_READY,
    },
    CanteenOrder.STATUS_READY: {
        CanteenOrder.STATUS_OUT_FOR_DELIVERY,
        CanteenOrder.STATUS_PICKED_UP,
    },
    CanteenOrder.STATUS_OUT_FOR_DELIVERY: {
        CanteenOrder.STATUS_DELIVERED,
    },
    CanteenOrder.STATUS_DELIVERED: set(),
    CanteenOrder.STATUS_PICKED_UP: set(),
    CanteenOrder.STATUS_REJECTED: set(),
    CanteenOrder.STATUS_CANCELLED: set(),
}


def _next_sequence_for_today():
    prefix = timezone.now().strftime("UD-%Y%m%d-")
    last_order = CanteenOrder.objects.filter(order_number__startswith=prefix).order_by("-order_number").first()
    if not last_order:
        return prefix, 1
    try:
        seq = int(last_order.order_number.rsplit("-", 1)[1]) + 1
    except (ValueError, IndexError):
        seq = 1
    return prefix, seq


def generate_order_number():
    prefix, sequence = _next_sequence_for_today()
    for _ in range(20):
        order_number = f"{prefix}{sequence:04d}"
        if not CanteenOrder.objects.filter(order_number=order_number).exists():
            return order_number
        sequence += 1
    return f"{prefix}{secrets.randbelow(9999):04d}"


def generate_pickup_otp():
    return "".join(secrets.choice("0123456789") for _ in range(6))


def generate_pickup_qr_code():
    return uuid.uuid4().hex


def calculate_delivery_fee(canteen, subtotal, order_type):
    if order_type != CanteenOrder.ORDER_TYPE_DELIVERY:
        return Decimal("0.00")
    if not canteen.is_delivery_available:
        raise ValidationError({"order_type": "Delivery is not available for this canteen."})
    if subtotal < canteen.min_order_amount:
        raise ValidationError(
            {
                "items": (
                    f"Minimum order amount for delivery is {canteen.min_order_amount}. "
                    f"Current subtotal is {subtotal}."
                )
            }
        )
    return canteen.delivery_fee


def validate_and_prepare_items(canteen, items_payload):
    if not items_payload:
        raise ValidationError({"items": "At least one menu item is required."})

    requested_ids = []
    for item in items_payload:
        menu_item_id = item.get("menu_item_id")
        quantity = item.get("quantity", 0)
        if not menu_item_id:
            raise ValidationError({"items": "Each item must include menu_item_id."})
        if quantity <= 0:
            raise ValidationError({"items": "Each item quantity must be greater than zero."})
        requested_ids.append(menu_item_id)

    menu_items = (
        CanteenMenuItem.objects.select_for_update()
        .filter(
            id__in=requested_ids,
            canteen=canteen,
            is_active=True,
            is_available=True,
        )
        .select_related("canteen")
    )
    menu_item_map = {item.id: item for item in menu_items}

    prepared_items = []
    subtotal = Decimal("0.00")
    max_prep_mins = 0

    for item in items_payload:
        menu_item_id = item["menu_item_id"]
        quantity = int(item["quantity"])
        menu_item = menu_item_map.get(menu_item_id)
        if not menu_item:
            raise ValidationError({"items": f"Menu item {menu_item_id} does not exist or is unavailable."})
        if menu_item.available_quantity < quantity:
            raise ValidationError(
                {
                    "items": (
                        f"Insufficient stock for '{menu_item.item_name}'. "
                        f"Requested {quantity}, available {menu_item.available_quantity}."
                    )
                }
            )
        line_total = menu_item.price * quantity
        subtotal += line_total
        max_prep_mins = max(max_prep_mins, menu_item.preparation_time_mins)
        prepared_items.append(
            {
                "menu_item": menu_item,
                "quantity": quantity,
                "unit_price": menu_item.price,
                "total_price": line_total,
                "special_instructions": item.get("special_instructions", "")[:250],
            }
        )

    return prepared_items, subtotal, max_prep_mins


def validate_payment_method(canteen, payment_method):
    config = getattr(canteen, "payment_config", None)
    payment_mode = getattr(config, "payment_mode", CanteenPaymentConfig.PAYMENT_MODE_BOTH)

    if payment_mode == CanteenPaymentConfig.PAYMENT_MODE_ONLINE and payment_method != "razorpay":
        raise ValidationError({"payment_method": "This canteen only accepts online payments."})

    if payment_mode == CanteenPaymentConfig.PAYMENT_MODE_CASH and payment_method != "cash":
        raise ValidationError({"payment_method": "This canteen only accepts pay-later orders."})


@transaction.atomic
def create_order_for_student(student, validated_data):
    canteen = (
        Canteen.objects.select_for_update()
        .select_related("payment_config")
        .filter(id=validated_data["canteen_id"], is_active=True)
        .first()
    )
    if not canteen:
        raise ValidationError({"canteen_id": "Canteen not found."})

    order_type = validated_data.get("order_type", CanteenOrder.ORDER_TYPE_PICKUP)
    payment_method = validated_data.get("payment_method", "cash")
    delivery_address = (validated_data.get("delivery_address") or "").strip()
    if order_type == CanteenOrder.ORDER_TYPE_DELIVERY and not delivery_address:
        raise ValidationError({"delivery_address": "Delivery address is required for delivery orders."})
    validate_payment_method(canteen, payment_method)

    prepared_items, subtotal, max_prep_mins = validate_and_prepare_items(canteen, validated_data["items"])
    delivery_fee = calculate_delivery_fee(canteen, subtotal, order_type)
    total_amount = subtotal + delivery_fee

    scheduled_time = validated_data.get("scheduled_time")
    estimated_ready_time = scheduled_time or (timezone.now() + timedelta(minutes=max_prep_mins))

    order = CanteenOrder.objects.create(
        order_number=generate_order_number(),
        student=student,
        canteen=canteen,
        order_type=order_type,
        scheduled_time=scheduled_time,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        delivery_address=delivery_address,
        estimated_ready_time=estimated_ready_time,
        notes=validated_data.get("notes", "").strip(),
        pickup_qr_code=generate_pickup_qr_code() if order_type != CanteenOrder.ORDER_TYPE_DELIVERY else "",
        pickup_otp=generate_pickup_otp(),
    )

    order_items = []
    for prepared in prepared_items:
        menu_item = prepared["menu_item"]
        menu_item.available_quantity -= prepared["quantity"]
        menu_item.save(update_fields=["available_quantity", "updated_at"])
        order_items.append(
            CanteenOrderItem(
                order=order,
                menu_item=menu_item,
                quantity=prepared["quantity"],
                unit_price=prepared["unit_price"],
                total_price=prepared["total_price"],
                special_instructions=prepared["special_instructions"],
            )
        )
    CanteenOrderItem.objects.bulk_create(order_items)
    return order


def validate_status_transition(order, new_status):
    if new_status == order.status:
        return
    allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise ValidationError(
            {"status": f"Cannot move order from '{order.status}' to '{new_status}'."}
        )
    if order.order_type != CanteenOrder.ORDER_TYPE_DELIVERY and new_status in (
        CanteenOrder.STATUS_OUT_FOR_DELIVERY,
        CanteenOrder.STATUS_DELIVERED,
    ):
        raise ValidationError({"status": "Pickup/prebook orders cannot use delivery statuses."})
    if order.order_type == CanteenOrder.ORDER_TYPE_DELIVERY and new_status == CanteenOrder.STATUS_PICKED_UP:
        raise ValidationError({"status": "Delivery orders cannot be marked as picked up."})


def restore_order_inventory(order):
    items = list(order.items.select_related("menu_item").select_for_update())
    for item in items:
        menu_item = item.menu_item
        menu_item.available_quantity += item.quantity
        menu_item.save(update_fields=["available_quantity", "updated_at"])


@transaction.atomic
def cancel_order(order, reason=""):
    validate_status_transition(order, CanteenOrder.STATUS_CANCELLED)
    restore_order_inventory(order)
    order.status = CanteenOrder.STATUS_CANCELLED
    order.cancellation_reason = reason[:250]
    order.save(update_fields=["status", "cancellation_reason", "updated_at"])
    return order


def verify_pickup(order, pickup_otp="", pickup_qr_code=""):
    if order.order_type == CanteenOrder.ORDER_TYPE_DELIVERY:
        raise ValidationError({"detail": "Delivery orders cannot be verified as pickup."})
    if order.status != CanteenOrder.STATUS_READY:
        raise ValidationError({"detail": "Pickup can only be verified once order is ready."})
    if not pickup_otp and not pickup_qr_code:
        raise ValidationError({"detail": "Either pickup_otp or pickup_qr_code is required."})
    if pickup_otp and pickup_otp != order.pickup_otp:
        raise ValidationError({"pickup_otp": "Invalid pickup OTP."})
    if pickup_qr_code and pickup_qr_code != order.pickup_qr_code:
        raise ValidationError({"pickup_qr_code": "Invalid pickup QR code."})
    order.status = CanteenOrder.STATUS_PICKED_UP
    order.save(update_fields=["status", "updated_at"])
    return order
