from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.mess.models import Mess, MessBooking, MessMenuItem
from apps.mess.services import cancel_booking, create_booking, redeem_booking
from apps.mess.tasks import expire_stale_bookings, reset_daily_menu_inventory
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessTaskTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student role")
        cls.worker_role = Role.objects.create(role_name="mess_worker", description="Worker role")

    def setUp(self):
        self.student = self._create_student("1")
        self.worker = self._create_worker("1")
        MessAccount.objects.create(student=self.student, balance=Decimal("10000.00"))

        self.mess = Mess.objects.create(
            name="Hall Mess 1",
            location="Zone A",
            hall_name="Hall 1",
            is_active=True,
        )
        self.menu_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Paneer Roll",
            description="Main item",
            price=Decimal("40.00"),
            meal_type=MessMenuItem.MealType.LUNCH,
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=50,
            default_quantity=50,
            is_active=True,
        )

    def _create_student(self, suffix):
        user = User.objects.create_user(
            email=f"task-student-{suffix}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        return Student.objects.create(
            user=user,
            roll_number=f"TASK-ST-{suffix}",
            full_name=f"Task Student {suffix}",
            hostel_name="Hall 1",
            room_number=f"{suffix}01",
        )

    def _create_worker(self, suffix):
        user = User.objects.create_user(
            email=f"task-worker-{suffix}@example.com",
            password="pass1234",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        return Staff.objects.create(
            user=user,
            full_name=f"Task Worker {suffix}",
            employee_code=f"TASK-W-{suffix}",
            is_mess_staff=True,
        )

    def test_expire_stale_bookings_marks_expired_and_restores_inventory(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=3)
        self.menu_item.refresh_from_db()
        self.assertEqual(self.menu_item.available_quantity, 47)

        booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=["qr_expires_at"])

        result = expire_stale_bookings()

        booking.refresh_from_db()
        self.menu_item.refresh_from_db()
        self.assertEqual(booking.status, MessBooking.Status.EXPIRED)
        self.assertEqual(self.menu_item.available_quantity, 50)
        self.assertEqual(result["processed_count"], 1)
        self.assertEqual(result["expired_count"], 1)
        self.assertEqual(result["skipped_count"], 0)

    def test_expire_stale_bookings_respects_batch_size(self):
        booking_1 = create_booking(self.student, self.menu_item.id, quantity=1)
        booking_2 = create_booking(self.student, self.menu_item.id, quantity=1)
        past_time = timezone.now() - timedelta(minutes=2)
        MessBooking.objects.filter(id__in=[booking_1.id, booking_2.id]).update(qr_expires_at=past_time)

        result = expire_stale_bookings(batch_size=1, restore_inventory=False)

        expired_count = MessBooking.objects.filter(status=MessBooking.Status.EXPIRED).count()
        pending_count = MessBooking.objects.filter(status=MessBooking.Status.PENDING).count()
        self.assertEqual(result["processed_count"], 1)
        self.assertEqual(result["expired_count"], 1)
        self.assertEqual(expired_count, 1)
        self.assertEqual(pending_count, 1)

    def test_expire_stale_bookings_ignores_non_pending_and_future_pending(self):
        stale_pending = create_booking(self.student, self.menu_item.id, quantity=1)
        stale_pending.qr_expires_at = timezone.now() - timedelta(minutes=1)
        stale_pending.save(update_fields=["qr_expires_at"])

        future_pending = create_booking(self.student, self.menu_item.id, quantity=1)
        future_pending.qr_expires_at = timezone.now() + timedelta(hours=1)
        future_pending.save(update_fields=["qr_expires_at"])

        redeemed_booking = create_booking(self.student, self.menu_item.id, quantity=1)
        redeem_booking(redeemed_booking.id, staff=self.worker, qr_code=redeemed_booking.qr_code)
        redeemed_booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        redeemed_booking.save(update_fields=["qr_expires_at"])

        cancelled_booking = create_booking(self.student, self.menu_item.id, quantity=1)
        cancel_booking(cancelled_booking.id, student=self.student)
        cancelled_booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        cancelled_booking.save(update_fields=["qr_expires_at"])

        result = expire_stale_bookings()

        stale_pending.refresh_from_db()
        future_pending.refresh_from_db()
        redeemed_booking.refresh_from_db()
        cancelled_booking.refresh_from_db()

        self.assertEqual(stale_pending.status, MessBooking.Status.EXPIRED)
        self.assertEqual(future_pending.status, MessBooking.Status.PENDING)
        self.assertEqual(redeemed_booking.status, MessBooking.Status.REDEEMED)
        self.assertEqual(cancelled_booking.status, MessBooking.Status.CANCELLED)
        self.assertEqual(result["expired_count"], 1)

    def test_reset_daily_menu_inventory_updates_active_items_only(self):
        active_changed = self.menu_item
        active_same = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Veg Burger",
            description="Same qty",
            price=Decimal("50.00"),
            meal_type=MessMenuItem.MealType.SNACK,
            day_of_week=MessMenuItem.DayOfWeek.TUESDAY,
            available_quantity=30,
            default_quantity=30,
            is_active=True,
        )
        inactive_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Aloo Paratha",
            description="Inactive",
            price=Decimal("25.00"),
            meal_type=MessMenuItem.MealType.BREAKFAST,
            day_of_week=MessMenuItem.DayOfWeek.WEDNESDAY,
            available_quantity=7,
            default_quantity=25,
            is_active=False,
        )

        active_changed.available_quantity = 10
        active_changed.default_quantity = 50
        active_changed.save(update_fields=["available_quantity", "default_quantity", "updated_at"])

        result = reset_daily_menu_inventory()

        active_changed.refresh_from_db()
        active_same.refresh_from_db()
        inactive_item.refresh_from_db()

        self.assertEqual(result["updated_count"], 1)
        self.assertEqual(active_changed.available_quantity, 50)
        self.assertEqual(active_same.available_quantity, 30)
        self.assertEqual(inactive_item.available_quantity, 7)
