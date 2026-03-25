from __future__ import annotations

import io
import json
import uuid
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone

from apps.users.models import MessAccount

from .models import MessBooking, MessMenuItem

TWO_DECIMAL_PLACES = Decimal("0.01")


class MessServiceError(Exception):
    """Base service-layer exception for mess domain operations."""


class BookingValidationError(MessServiceError):
    """Raised when booking input is invalid."""


class InsufficientStockError(BookingValidationError):
    """Raised when requested quantity exceeds available stock."""


class InsufficientBalanceError(BookingValidationError):
    """Raised when student balance is insufficient."""


class BookingStateError(MessServiceError):
    """Raised when booking state does not allow the requested transition."""


class BookingExpiredError(BookingStateError):
    """Raised when an operation is attempted on an expired booking."""


class QRGenerationError(MessServiceError):
    """Raised when QR image generation cannot be completed."""


def _quantize_amount(amount: Decimal) -> Decimal:
    return amount.quantize(TWO_DECIMAL_PLACES, rounding=ROUND_HALF_UP)


def generate_booking_qr_token(prefix: str = "mess") -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def build_booking_qr_payload(booking: MessBooking) -> dict:
    return {
        "booking_id": booking.id,
        "qr_code": booking.qr_code,
        "student_id": booking.student_id,
        "menu_item_id": booking.menu_item_id,
        "expires_at": booking.qr_expires_at.isoformat(),
    }


def generate_booking_qr_image(payload: dict | str) -> bytes:
    try:
        import qrcode
    except ModuleNotFoundError as exc:
        raise QRGenerationError(
            "qrcode package is required for QR image generation."
        ) from exc

    if isinstance(payload, dict):
        payload = json.dumps(payload, sort_keys=True, separators=(",", ":"))

    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(payload)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def calculate_booking_total(menu_item: MessMenuItem, quantity: int) -> Decimal:
    if quantity <= 0:
        raise BookingValidationError("Quantity must be greater than zero.")
    if menu_item.price is None or menu_item.price < 0:
        raise BookingValidationError("Menu item price must be a non-negative value.")
    return _quantize_amount(Decimal(menu_item.price) * Decimal(quantity))


def validate_booking_request(student, menu_item: MessMenuItem, quantity: int) -> Decimal:
    if quantity <= 0:
        raise BookingValidationError("Quantity must be greater than zero.")
    if not menu_item.is_active:
        raise BookingValidationError("Selected menu item is inactive.")
    if menu_item.available_quantity < quantity:
        raise InsufficientStockError("Insufficient stock for requested quantity.")

    total = calculate_booking_total(menu_item, quantity)

    try:
        MessAccount.objects.get(student=student)
    except MessAccount.DoesNotExist as exc:
        raise BookingValidationError("Mess account not found for student.") from exc

    return total


def _get_mess_account_for_update(student) -> MessAccount:
    try:
        return MessAccount.objects.select_for_update().get(student=student)
    except MessAccount.DoesNotExist as exc:
        raise BookingValidationError("Mess account not found for student.") from exc


def debit_mess_account(student, amount: Decimal) -> MessAccount:
    amount = _quantize_amount(Decimal(amount))
    if amount <= 0:
        raise BookingValidationError("Debit amount must be greater than zero.")

    account = _get_mess_account_for_update(student)

    account.balance = _quantize_amount(account.balance - amount)
    account.save(update_fields=["balance", "last_updated"])
    return account


def refund_mess_account(student, amount: Decimal) -> MessAccount:
    amount = _quantize_amount(Decimal(amount))
    if amount <= 0:
        raise BookingValidationError("Refund amount must be greater than zero.")

    account = _get_mess_account_for_update(student)
    account.balance = _quantize_amount(account.balance + amount)
    account.save(update_fields=["balance", "last_updated"])
    return account


@transaction.atomic
def create_booking(student, menu_item_id: int, quantity: int, *, qr_validity_hours: int = 3) -> MessBooking:
    try:
        menu_item = MessMenuItem.objects.select_for_update().get(pk=menu_item_id)
    except MessMenuItem.DoesNotExist as exc:
        raise BookingValidationError("Menu item not found.") from exc

    total = validate_booking_request(student, menu_item, quantity)

    debit_mess_account(student, total)

    menu_item.available_quantity -= quantity
    menu_item.save(update_fields=["available_quantity", "updated_at"])

    now = timezone.now()
    booking = MessBooking.objects.create(
        student=student,
        menu_item=menu_item,
        quantity=quantity,
        total_price=total,
        meal_type=menu_item.meal_type,
        qr_code=generate_booking_qr_token(),
        qr_generated_at=now,
        qr_expires_at=now + timedelta(hours=qr_validity_hours),
    )
    return booking


def get_booking_by_qr_code(qr_code: str, *, for_update: bool = False) -> MessBooking:
    queryset = MessBooking.objects.select_related("student", "menu_item")
    if for_update:
        queryset = queryset.select_for_update()
    else:
        queryset = queryset.select_related("redeemed_by_staff")
    try:
        return queryset.get(qr_code=qr_code)
    except MessBooking.DoesNotExist as exc:
        raise BookingStateError("Invalid QR code.") from exc


def _ensure_booking_redeemable(booking: MessBooking, *, now=None):
    current_time = now or timezone.now()

    if booking.status == MessBooking.Status.REDEEMED:
        raise BookingStateError("Booking is already redeemed.")
    if booking.status == MessBooking.Status.CANCELLED:
        raise BookingStateError("Booking is cancelled and cannot be redeemed.")
    if booking.status == MessBooking.Status.EXPIRED:
        raise BookingExpiredError("Booking is already expired.")
    if booking.status != MessBooking.Status.PENDING:
        raise BookingStateError(f"Booking is not redeemable in '{booking.status}' state.")
    if booking.qr_expires_at <= current_time:
        raise BookingExpiredError("QR code has expired.")


@transaction.atomic
def redeem_booking(booking_id: int, *, staff=None, qr_code: str | None = None, now=None) -> MessBooking:
    try:
        booking = (
            MessBooking.objects.select_for_update()
            .select_related("student", "menu_item")
            .get(pk=booking_id)
        )
    except MessBooking.DoesNotExist as exc:
        raise BookingStateError("Booking not found.") from exc

    if qr_code and booking.qr_code != qr_code:
        raise BookingStateError("QR code does not match booking.")

    current_time = now or timezone.now()
    _ensure_booking_redeemable(booking, now=current_time)

    booking.status = MessBooking.Status.REDEEMED
    booking.redeemed_at = current_time
    booking.redeemed_by_staff = staff
    booking.save(update_fields=["status", "redeemed_at", "redeemed_by_staff", "updated_at"])
    return booking


@transaction.atomic
def cancel_booking(
    booking_id: int,
    *,
    student=None,
    refund: bool = True,
    restore_inventory: bool = True,
    now=None,
) -> MessBooking:
    try:
        booking = (
            MessBooking.objects.select_for_update()
            .select_related("student", "menu_item")
            .get(pk=booking_id)
        )
    except MessBooking.DoesNotExist as exc:
        raise BookingStateError("Booking not found.") from exc
    current_time = now or timezone.now()

    if student is not None and booking.student_id != student.id:
        raise BookingStateError("Booking does not belong to the current student.")
    if booking.status != MessBooking.Status.PENDING:
        raise BookingStateError(f"Only pending bookings can be cancelled, got '{booking.status}'.")
    if booking.qr_expires_at <= current_time:
        raise BookingExpiredError("Expired booking cannot be cancelled.")

    booking.status = MessBooking.Status.CANCELLED
    booking.save(update_fields=["status", "updated_at"])

    if restore_inventory:
        menu_item = MessMenuItem.objects.select_for_update().get(pk=booking.menu_item_id)
        menu_item.available_quantity += booking.quantity
        menu_item.save(update_fields=["available_quantity", "updated_at"])

    if refund:
        refund_mess_account(booking.student, booking.total_price)

    return booking


@transaction.atomic
def expire_booking(booking_id: int, *, restore_inventory: bool = False, now=None) -> MessBooking:
    try:
        booking = (
            MessBooking.objects.select_for_update()
            .select_related("menu_item", "student")
            .get(pk=booking_id)
        )
    except MessBooking.DoesNotExist as exc:
        raise BookingStateError("Booking not found.") from exc
    current_time = now or timezone.now()

    if booking.status != MessBooking.Status.PENDING:
        return booking
    if booking.qr_expires_at > current_time:
        return booking

    booking.status = MessBooking.Status.EXPIRED
    booking.save(update_fields=["status", "updated_at"])

    if restore_inventory:
        menu_item = MessMenuItem.objects.select_for_update().get(pk=booking.menu_item_id)
        menu_item.available_quantity += booking.quantity
        menu_item.save(update_fields=["available_quantity", "updated_at"])

    return booking
