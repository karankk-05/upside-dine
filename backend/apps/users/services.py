import random

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail


OTP_TTL_SECONDS = 300
OTP_ATTEMPT_TTL_SECONDS = 3600
OTP_MAX_ATTEMPTS = 5


def _otp_key(email):
    return f"otp:email:{email}"


def _otp_attempt_key(email):
    return f"otp:attempts:{email}"


def generate_otp(email):
    otp = f"{random.randint(0, 999999):06d}"
    cache.set(_otp_key(email), otp, timeout=OTP_TTL_SECONDS)
    return otp


def record_otp_attempt(email):
    key = _otp_attempt_key(email)
    attempts = cache.get(key, 0) + 1
    cache.set(key, attempts, timeout=OTP_ATTEMPT_TTL_SECONDS)
    return attempts


def is_otp_rate_limited(email):
    attempts = cache.get(_otp_attempt_key(email), 0)
    return attempts >= OTP_MAX_ATTEMPTS


def verify_otp(email, otp):
    stored = cache.get(_otp_key(email))
    return stored == otp


def send_otp_email(email, otp):
    subject = "Upside Dine OTP Verification"
    message = f"Your OTP for Upside Dine is {otp}. It is valid for 5 minutes."
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@upsidedine.local")
    send_mail(subject, message, from_email, [email], fail_silently=False)