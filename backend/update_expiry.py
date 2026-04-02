import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.utils import timezone
from apps.mess.models import MessBooking

def fix_expiries():
    bookings = MessBooking.objects.filter(status='pending')
    now = timezone.localtime(timezone.now())
    target_expiry = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    count = 0
    for booking in bookings:
        booking.qr_expires_at = target_expiry
        booking.save()
        count += 1
    print(f"Updated {count} existing bookings to expire at: {target_expiry}")

if __name__ == "__main__":
    fix_expiries()
