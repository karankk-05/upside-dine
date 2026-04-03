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


def _email_count_key(email):
    return f"email:count:{email}"


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


def is_email_limit_reached(email):
    """Check if the account has exceeded the max emails allowed."""
    max_emails = getattr(settings, "MAX_EMAILS_PER_ACCOUNT", 10)
    count = cache.get(_email_count_key(email), 0)
    return count >= max_emails


def send_otp_email(email, otp):
    """Send OTP email if the per-account email limit has not been exceeded."""
    if is_email_limit_reached(email):
        raise ValueError("Email limit reached for this account. Max 10 emails allowed.")

    subject = "Upside Dine OTP Verification"
    message = f"Your OTP for Upside Dine is {otp}. It is valid for 5 minutes."
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@upsidedine.local")
    
    # Send email asynchronously via Celery using delay() to prevent worker timeouts
    from apps.users.tasks import send_email_async
    send_email_async.delay(subject, message, from_email, [email])

    # Increment the email counter (persists for 24 hours)
    key = _email_count_key(email)
    count = cache.get(key, 0) + 1
    cache.set(key, count, timeout=86400)