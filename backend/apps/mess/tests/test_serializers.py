from decimal import Decimal

from django.test import TestCase
from rest_framework import serializers

from apps.mess.models import Mess, MessBooking, MessMenuItem
from apps.mess.serializers import (
    MessBookingCancelSerializer,
    MessBookingCreateSerializer,
    MessInventoryUpdateSerializer,
    MessWorkerVerifySerializer,
)
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessSerializerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student")
        cls.worker_role = Role.objects.create(role_name="mess_worker", description="Mess Worker")

    def setUp(self):
        self.student = self._create_student("1")
        self.other_student = self._create_student("2")
        self.staff = self._create_staff("1")

        self.account = MessAccount.objects.create(student=self.student, balance=Decimal("300.00"))
        MessAccount.objects.create(student=self.other_student, balance=Decimal("300.00"))

        self.mess = Mess.objects.create(
            name="Hall Mess 1",
            location="Zone A",
            hall_name="Hall 1",
            is_active=True,
        )
        self.other_mess = Mess.objects.create(
            name="Hall Mess 2",
            location="Zone B",
            hall_name="Hall 2",
            is_active=True,
        )
        self.menu_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Paneer Roll",
            description="Good",
            price=Decimal("40.00"),
            meal_type=MessMenuItem.MealType.LUNCH,
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=10,
            default_quantity=12,
            is_active=True,
        )

    def _create_student(self, suffix: str) -> Student:
        user = User.objects.create_user(
            email=f"serializer-student-{suffix}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        return Student.objects.create(
            user=user,
            roll_number=f"SERIALIZER-ROLL-{suffix}",
            full_name=f"Serializer Student {suffix}",
            hostel_name="Hall 1",
            room_number=f"{suffix}01",
        )

    def _create_staff(self, suffix: str) -> Staff:
        user = User.objects.create_user(
            email=f"serializer-worker-{suffix}@example.com",
            password="pass1234",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        return Staff.objects.create(
            user=user,
            full_name=f"Serializer Worker {suffix}",
            employee_code=f"SERIALIZER-EMP-{suffix}",
            is_mess_staff=True,
        )

    def test_booking_create_serializer_success(self):
        serializer = MessBookingCreateSerializer(
            data={"menu_item": self.menu_item.id, "quantity": 2},
            context={"student": self.student},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        booking = serializer.save()

        self.assertEqual(booking.status, MessBooking.Status.PENDING)
        self.assertEqual(booking.total_price, Decimal("80.00"))
        self.assertEqual(booking.meal_type, self.menu_item.meal_type)

        self.account.refresh_from_db()
        self.menu_item.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("220.00"))
        self.assertEqual(self.menu_item.available_quantity, 8)

    def test_booking_create_rejects_meal_type_mismatch(self):
        serializer = MessBookingCreateSerializer(
            data={
                "menu_item": self.menu_item.id,
                "quantity": 1,
                "meal_type": MessMenuItem.MealType.BREAKFAST,
            },
            context={"student": self.student},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("meal_type", serializer.errors)

    def test_booking_create_rejects_mess_id_mismatch(self):
        serializer = MessBookingCreateSerializer(
            data={
                "menu_item": self.menu_item.id,
                "quantity": 1,
                "mess_id": self.other_mess.id,
            },
            context={"student": self.student},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("mess_id", serializer.errors)

    def test_booking_create_rejects_insufficient_balance(self):
        self.account.balance = Decimal("10.00")
        self.account.save(update_fields=["balance", "last_updated"])

        serializer = MessBookingCreateSerializer(
            data={"menu_item": self.menu_item.id, "quantity": 1},
            context={"student": self.student},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("detail", serializer.errors)

    def test_booking_cancel_serializer_success(self):
        booking = MessBookingCreateSerializer(
            data={"menu_item": self.menu_item.id, "quantity": 1},
            context={"student": self.student},
        )
        self.assertTrue(booking.is_valid(), booking.errors)
        booking = booking.save()

        serializer = MessBookingCancelSerializer(data={}, context={"student": self.student})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cancelled = serializer.save(booking=booking)
        self.assertEqual(cancelled.status, MessBooking.Status.CANCELLED)

    def test_booking_cancel_serializer_rejects_non_owner(self):
        booking = MessBookingCreateSerializer(
            data={"menu_item": self.menu_item.id, "quantity": 1},
            context={"student": self.student},
        )
        self.assertTrue(booking.is_valid(), booking.errors)
        booking = booking.save()

        serializer = MessBookingCancelSerializer(data={}, context={"student": self.other_student})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        with self.assertRaises(serializers.ValidationError):
            serializer.save(booking=booking)

    def test_worker_verify_serializer_requires_single_identifier(self):
        serializer_none = MessWorkerVerifySerializer(data={}, context={"staff": self.staff})
        self.assertFalse(serializer_none.is_valid())

        serializer_both = MessWorkerVerifySerializer(
            data={"booking_id": 1, "qr_code": "abc"},
            context={"staff": self.staff},
        )
        self.assertFalse(serializer_both.is_valid())

    def test_worker_verify_serializer_success_by_booking_id(self):
        create_ser = MessBookingCreateSerializer(
            data={"menu_item": self.menu_item.id, "quantity": 1},
            context={"student": self.student},
        )
        self.assertTrue(create_ser.is_valid(), create_ser.errors)
        booking = create_ser.save()

        verify_ser = MessWorkerVerifySerializer(
            data={"booking_id": booking.id},
            context={"staff": self.staff},
        )
        self.assertTrue(verify_ser.is_valid(), verify_ser.errors)
        redeemed = verify_ser.save()
        self.assertEqual(redeemed.status, MessBooking.Status.REDEEMED)
        self.assertEqual(redeemed.redeemed_by_staff_id, self.staff.id)

    def test_worker_verify_serializer_rejects_invalid_qr(self):
        verify_ser = MessWorkerVerifySerializer(
            data={"qr_code": "invalid-qr"},
            context={"staff": self.staff},
        )
        self.assertTrue(verify_ser.is_valid(), verify_ser.errors)
        with self.assertRaises(serializers.ValidationError):
            verify_ser.save()

    def test_inventory_update_serializer_requires_at_least_one_field(self):
        serializer = MessInventoryUpdateSerializer(
            instance=self.menu_item,
            data={},
            partial=True,
        )
        self.assertFalse(serializer.is_valid())

    def test_inventory_update_serializer_updates_values(self):
        serializer = MessInventoryUpdateSerializer(
            instance=self.menu_item,
            data={"available_quantity": 8, "default_quantity": 15},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.available_quantity, 8)
        self.assertEqual(updated.default_quantity, 15)
