from datetime import timedelta
from decimal import Decimal
from importlib.util import find_spec

from django.test import TestCase
from django.utils import timezone

from apps.mess.models import Mess, MessBooking, MessMenuItem
from apps.mess.services import (
    BookingExpiredError,
    BookingStateError,
    BookingValidationError,
    InsufficientBalanceError,
    InsufficientStockError,
    QRGenerationError,
    build_booking_qr_payload,
    calculate_booking_total,
    cancel_booking,
    create_booking,
    debit_mess_account,
    expire_booking,
    generate_booking_qr_image,
    redeem_booking,
    refund_mess_account,
    validate_booking_request,
)
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessServiceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student role")
        cls.manager_role = Role.objects.create(role_name="mess_manager", description="Manager role")
        cls.worker_role = Role.objects.create(role_name="mess_worker", description="Worker role")

    def setUp(self):
        self.student = self._create_student("1")
        self.worker = self._create_staff("1")
        self.account = MessAccount.objects.create(student=self.student, balance=Decimal("500.00"))
        self.mess = Mess.objects.create(
            name="Hall Mess 1",
            location="Zone A",
            hall_name="Hall 1",
            is_active=True,
        )
        self.menu_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Paneer Roll",
            description="Tasty roll",
            price=Decimal("40.00"),
            meal_type=MessMenuItem.MealType.LUNCH,
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=10,
            default_quantity=12,
            is_active=True,
        )

    def _create_student(self, suffix: str) -> Student:
        user = User.objects.create_user(
            email=f"student{suffix}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        return Student.objects.create(
            user=user,
            roll_number=f"ROLL-{suffix}",
            full_name=f"Student {suffix}",
            hostel_name="Hall 1",
            room_number=f"{suffix}01",
        )

    def _create_staff(self, suffix: str) -> Staff:
        user = User.objects.create_user(
            email=f"worker{suffix}@example.com",
            password="pass1234",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        return Staff.objects.create(
            user=user,
            full_name=f"Worker {suffix}",
            employee_code=f"EMP-W-{suffix}",
            is_mess_staff=True,
        )

    def test_calculate_booking_total_success(self):
        total = calculate_booking_total(self.menu_item, 3)
        self.assertEqual(total, Decimal("120.00"))

    def test_calculate_booking_total_invalid_quantity(self):
        with self.assertRaises(BookingValidationError):
            calculate_booking_total(self.menu_item, 0)

    def test_validate_booking_request_raises_for_inactive_item(self):
        self.menu_item.is_active = False
        self.menu_item.save(update_fields=["is_active"])
        with self.assertRaises(BookingValidationError):
            validate_booking_request(self.student, self.menu_item, 1)

    def test_debit_and_refund_account_updates_balance(self):
        debit_mess_account(self.student, Decimal("50.00"))
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("450.00"))

        refund_mess_account(self.student, Decimal("50.00"))
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("500.00"))

    def test_create_booking_debits_balance_and_reduces_stock(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=2, qr_validity_hours=3)

        self.account.refresh_from_db()
        self.menu_item.refresh_from_db()
        booking.refresh_from_db()

        self.assertEqual(self.account.balance, Decimal("420.00"))
        self.assertEqual(self.menu_item.available_quantity, 8)
        self.assertEqual(booking.status, MessBooking.Status.PENDING)
        self.assertEqual(booking.total_price, Decimal("80.00"))

    def test_create_booking_fails_for_insufficient_stock_without_side_effects(self):
        with self.assertRaises(InsufficientStockError):
            create_booking(self.student, self.menu_item.id, quantity=99)

        self.account.refresh_from_db()
        self.menu_item.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("500.00"))
        self.assertEqual(self.menu_item.available_quantity, 10)
        self.assertEqual(MessBooking.objects.count(), 0)

    def test_create_booking_fails_for_insufficient_balance_without_side_effects(self):
        self.account.balance = Decimal("10.00")
        self.account.save(update_fields=["balance", "last_updated"])

        with self.assertRaises(InsufficientBalanceError):
            create_booking(self.student, self.menu_item.id, quantity=1)

        self.account.refresh_from_db()
        self.menu_item.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("10.00"))
        self.assertEqual(self.menu_item.available_quantity, 10)
        self.assertEqual(MessBooking.objects.count(), 0)

    def test_create_booking_fails_when_menu_item_missing(self):
        with self.assertRaises(BookingValidationError):
            create_booking(self.student, menu_item_id=999999, quantity=1)

    def test_cancel_booking_refunds_and_restores_inventory(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=2)
        cancelled = cancel_booking(booking.id, student=self.student)

        self.assertEqual(cancelled.status, MessBooking.Status.CANCELLED)
        self.account.refresh_from_db()
        self.menu_item.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("500.00"))
        self.assertEqual(self.menu_item.available_quantity, 10)

    def test_cancel_booking_fails_if_not_owner(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        other_student = self._create_student("2")
        MessAccount.objects.create(student=other_student, balance=Decimal("100.00"))

        with self.assertRaises(BookingStateError):
            cancel_booking(booking.id, student=other_student)

    def test_cancel_booking_fails_if_expired(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=["qr_expires_at"])

        with self.assertRaises(BookingExpiredError):
            cancel_booking(booking.id, student=self.student)

    def test_redeem_booking_success(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        redeemed = redeem_booking(booking.id, staff=self.worker, qr_code=booking.qr_code)
        self.assertEqual(redeemed.status, MessBooking.Status.REDEEMED)
        self.assertEqual(redeemed.redeemed_by_staff_id, self.worker.id)
        self.assertIsNotNone(redeemed.redeemed_at)

    def test_redeem_booking_qr_mismatch_raises(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        with self.assertRaises(BookingStateError):
            redeem_booking(booking.id, staff=self.worker, qr_code="wrong-qr")

    def test_redeem_booking_fails_when_booking_missing(self):
        with self.assertRaises(BookingStateError):
            redeem_booking(booking_id=999999, staff=self.worker, qr_code="any")

    def test_redeem_booking_rejects_expired_qr_without_state_change(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=["qr_expires_at"])

        with self.assertRaises(BookingExpiredError):
            redeem_booking(booking.id, staff=self.worker, qr_code=booking.qr_code)

        booking.refresh_from_db()
        self.assertEqual(booking.status, MessBooking.Status.PENDING)

    def test_expire_booking_can_restore_inventory(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=3)
        booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=["qr_expires_at"])

        expire_booking(booking.id, restore_inventory=True)
        booking.refresh_from_db()
        self.menu_item.refresh_from_db()

        self.assertEqual(booking.status, MessBooking.Status.EXPIRED)
        self.assertEqual(self.menu_item.available_quantity, 10)

    def test_cancel_booking_fails_when_booking_missing(self):
        with self.assertRaises(BookingStateError):
            cancel_booking(booking_id=999999, student=self.student)

    def test_expire_booking_fails_when_booking_missing(self):
        with self.assertRaises(BookingStateError):
            expire_booking(booking_id=999999, restore_inventory=True)

    def test_build_booking_payload_contains_expected_fields(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        payload = build_booking_qr_payload(booking)
        self.assertEqual(payload["booking_id"], booking.id)
        self.assertEqual(payload["qr_code"], booking.qr_code)
        self.assertEqual(payload["student_id"], booking.student_id)
        self.assertEqual(payload["menu_item_id"], booking.menu_item_id)
        self.assertIn("expires_at", payload)

    def test_generate_qr_image_handles_qrcode_dependency(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        payload = build_booking_qr_payload(booking)

        if find_spec("qrcode") is None:
            with self.assertRaises(QRGenerationError):
                generate_booking_qr_image(payload)
            return

        image_bytes = generate_booking_qr_image(payload)
        self.assertIsInstance(image_bytes, bytes)
        self.assertGreater(len(image_bytes), 0)
