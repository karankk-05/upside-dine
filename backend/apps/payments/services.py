from decimal import Decimal
import hashlib
import hmac

import requests
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError


def _get_razorpay_credentials():
    key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise ValidationError(
            {"detail": "Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."}
        )
    return key_id, key_secret


def _razorpay_url(path):
    base_url = getattr(settings, "RAZORPAY_BASE_URL", "https://api.razorpay.com/v1").rstrip("/")
    return f"{base_url}/{path.lstrip('/')}"


def create_razorpay_order(order):
    key_id, key_secret = _get_razorpay_credentials()
    amount_paise = int((order.total_amount * Decimal("100")).quantize(Decimal("1")))
    payload = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": order.order_number[:40],
        "payment_capture": 1,
    }
    response = requests.post(
        _razorpay_url("/orders"),
        json=payload,
        auth=(key_id, key_secret),
        timeout=15,
    )
    if response.status_code not in (200, 201):
        raise ValidationError({"detail": f"Failed to create Razorpay order: {response.text}"})
    return response.json()


def verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    _, key_secret = _get_razorpay_credentials()
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    generated_signature = hmac.new(key_secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated_signature, razorpay_signature)


def verify_webhook_signature(payload_bytes, signature):
    secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "") or getattr(settings, "RAZORPAY_KEY_SECRET", "")
    if not secret:
        raise ValidationError({"detail": "Razorpay webhook secret is not configured."})
    generated_signature = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated_signature, signature)


def mark_payment_captured(payment, razorpay_payment_id, razorpay_signature, payload=None):
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = payment.STATUS_CAPTURED
    payment.captured_at = timezone.now()
    if payload:
        payment.raw_response = payload
    payment.save(
        update_fields=[
            "razorpay_payment_id",
            "razorpay_signature",
            "status",
            "captured_at",
            "raw_response",
            "updated_at",
        ]
    )
    return payment


def mark_payment_failed(payment, reason):
    payment.status = payment.STATUS_FAILED
    payment.failure_reason = str(reason)[:500]
    payment.save(update_fields=["status", "failure_reason", "updated_at"])
    return payment


def initiate_refund(payment, amount=None):
    key_id, key_secret = _get_razorpay_credentials()
    if not payment.razorpay_payment_id:
        raise ValidationError({"detail": "Cannot refund payment without Razorpay payment ID."})

    refund_amount = amount or payment.amount
    if refund_amount <= 0:
        raise ValidationError({"amount": "Refund amount must be greater than zero."})
    if refund_amount > payment.amount:
        raise ValidationError({"amount": "Refund amount cannot exceed captured amount."})

    payload = {
        "amount": int((refund_amount * Decimal("100")).quantize(Decimal("1"))),
        "speed": "normal",
    }
    response = requests.post(
        _razorpay_url(f"/payments/{payment.razorpay_payment_id}/refund"),
        json=payload,
        auth=(key_id, key_secret),
        timeout=15,
    )
    if response.status_code not in (200, 201):
        raise ValidationError({"detail": f"Refund failed: {response.text}"})
    return response.json(), refund_amount
