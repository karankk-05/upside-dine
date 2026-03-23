from celery import shared_task
from django.db.models import F
from django.utils import timezone

from .models import MessBooking, MessMenuItem
from .services import expire_booking


@shared_task(name="apps.mess.tasks.expire_stale_bookings")
def expire_stale_bookings(batch_size=500, restore_inventory=True):
    now = timezone.now()
    stale_booking_ids = list(
        MessBooking.objects.filter(
            status=MessBooking.Status.PENDING,
            qr_expires_at__lt=now,
        )
        .order_by("qr_expires_at")
        .values_list("id", flat=True)[:batch_size]
    )

    expired_count = 0
    skipped_count = 0
    for booking_id in stale_booking_ids:
        booking = expire_booking(booking_id, restore_inventory=restore_inventory, now=now)
        if booking.status == MessBooking.Status.EXPIRED:
            expired_count += 1
        else:
            skipped_count += 1

    return {
        "processed_count": len(stale_booking_ids),
        "expired_count": expired_count,
        "skipped_count": skipped_count,
        "restore_inventory": bool(restore_inventory),
    }


@shared_task(name="apps.mess.tasks.reset_daily_menu_inventory")
def reset_daily_menu_inventory():
    now = timezone.now()
    updated_count = (
        MessMenuItem.objects.filter(is_active=True)
        .exclude(available_quantity=F("default_quantity"))
        .update(
            available_quantity=F("default_quantity"),
            updated_at=now,
        )
    )
    return {
        "updated_count": updated_count,
    }
