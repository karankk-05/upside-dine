from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier

from django.db import close_old_connections
from django.test import TransactionTestCase

from apps.mess.models import Mess, MessBooking, MessMenuItem
from apps.mess.services import (
    BookingStateError,
    InsufficientStockError,
    create_booking,
    redeem_booking,
)
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessRaceConditionTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.student_role, _ = Role.objects.get_or_create(role_name="student", defaults={"description": "Student"})
        self.worker_role, _ = Role.objects.get_or_create(
            role_name="mess_worker",
            defaults={"description": "Mess Worker"},
        )

        self.student_a = self._create_student("A")
        self.student_b = self._create_student("B")
        self.worker = self._create_worker("1")

        MessAccount.objects.create(student=self.student_a, balance=Decimal("5000.00"))
        MessAccount.objects.create(student=self.student_b, balance=Decimal("5000.00"))

        self.mess = Mess.objects.create(
            name="Race Mess",
            location="Zone R",
            hall_name="Hall R",
            is_active=True,
        )

    def _create_student(self, suffix):
        user = User.objects.create_user(
            email=f"race-student-{suffix.lower()}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        return Student.objects.create(
            user=user,
            roll_number=f"RACE-ST-{suffix}",
            full_name=f"Race Student {suffix}",
            hostel_name="Hall R",
            room_number=f"{suffix}01",
        )

    def _create_worker(self, suffix):
        user = User.objects.create_user(
            email=f"race-worker-{suffix}@example.com",
            password="pass1234",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        return Staff.objects.create(
            user=user,
            full_name=f"Race Worker {suffix}",
            employee_code=f"RACE-W-{suffix}",
            is_mess_staff=True,
        )

    def _create_menu_item(self, name, qty):
        return MessMenuItem.objects.create(
            mess=self.mess,
            item_name=name,
            description="Race test item",
            price=Decimal("40.00"),
            meal_type=MessMenuItem.MealType.LUNCH,
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=qty,
            default_quantity=qty,
            is_active=True,
        )

    def test_concurrent_redeem_allows_only_one_success(self):
        menu_item = self._create_menu_item("Concurrent Redeem Item", qty=5)
        booking = create_booking(self.student_a, menu_item.id, quantity=1)
        barrier = Barrier(2)

        def attempt_redeem():
            close_old_connections()
            try:
                barrier.wait(timeout=5)
                worker = Staff.objects.get(pk=self.worker.id)
                redeem_booking(booking.id, staff=worker, qr_code=booking.qr_code)
                return "success"
            except BookingStateError:
                return "state_error"
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = [future.result(timeout=10) for future in [pool.submit(attempt_redeem), pool.submit(attempt_redeem)]]

        self.assertEqual(results.count("success"), 1)
        self.assertEqual(results.count("state_error"), 1)

        booking.refresh_from_db()
        self.assertEqual(booking.status, MessBooking.Status.REDEEMED)
        self.assertEqual(booking.redeemed_by_staff_id, self.worker.id)

    def test_concurrent_low_stock_booking_allows_only_one_success(self):
        menu_item = self._create_menu_item("Low Stock Item", qty=1)
        barrier = Barrier(2)

        def attempt_booking(student_id):
            close_old_connections()
            try:
                barrier.wait(timeout=5)
                student = Student.objects.get(pk=student_id)
                create_booking(student, menu_item.id, quantity=1)
                return "success"
            except InsufficientStockError:
                return "stock_error"
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = [
                future.result(timeout=10)
                for future in [
                    pool.submit(attempt_booking, self.student_a.id),
                    pool.submit(attempt_booking, self.student_b.id),
                ]
            ]

        self.assertEqual(results.count("success"), 1)
        self.assertEqual(results.count("stock_error"), 1)
        self.assertEqual(MessBooking.objects.count(), 1)

        menu_item.refresh_from_db()
        self.assertEqual(menu_item.available_quantity, 0)
