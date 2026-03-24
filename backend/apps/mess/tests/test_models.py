from decimal import Decimal
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from apps.mess.models import Mess, MessBooking, MessMenuItem, MessStaffAssignment
from apps.users.models import Role, Staff, Student, User


class MessModelTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student role")
        cls.manager_role = Role.objects.create(role_name="mess_manager", description="Mess manager role")
        cls.worker_role = Role.objects.create(role_name="mess_worker", description="Mess worker role")

    def create_student(self, suffix="1"):
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

    def create_staff(self, suffix="1", role=None):
        if role is None:
            role = self.worker_role
        user = User.objects.create_user(
            email=f"staff{suffix}@example.com",
            password="pass1234",
            role=role,
            is_active=True,
            is_verified=True,
        )
        return Staff.objects.create(
            user=user,
            full_name=f"Staff {suffix}",
            employee_code=f"EMP-{suffix}",
            canteen_id=None,
            is_mess_staff=True,
        )

    def create_mess(self, suffix="1"):
        return Mess.objects.create(
            name=f"Hall Mess {suffix}",
            location=f"Sector {suffix}",
            hall_name=f"Hall {suffix}",
            is_active=True,
        )

    def create_menu_item(self, mess, suffix="1", **overrides):
        data = {
            "mess": mess,
            "item_name": f"Paneer {suffix}",
            "description": "Fresh paneer dish",
            "price": Decimal("40.00"),
            "meal_type": MessMenuItem.MealType.LUNCH,
            "day_of_week": MessMenuItem.DayOfWeek.MONDAY,
            "available_quantity": 20,
            "default_quantity": 25,
            "image_url": "",
            "is_active": True,
        }
        data.update(overrides)
        return MessMenuItem.objects.create(**data)


class MessModelTests(MessModelTestBase):
    def test_mess_string_representation(self):
        mess = self.create_mess("1")
        self.assertEqual(str(mess), "Hall Mess 1 (Hall 1)")

    def test_menu_item_unique_constraint_same_mess_day_meal_name(self):
        mess = self.create_mess("1")
        self.create_menu_item(mess, "A", item_name="Poha")
        with self.assertRaises(IntegrityError):
            self.create_menu_item(mess, "B", item_name="Poha")

    def test_menu_item_same_name_allowed_for_different_day(self):
        mess = self.create_mess("1")
        self.create_menu_item(
            mess,
            "A",
            item_name="Paratha",
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
        )
        item = self.create_menu_item(
            mess,
            "B",
            item_name="Paratha",
            day_of_week=MessMenuItem.DayOfWeek.TUESDAY,
        )
        self.assertEqual(item.day_of_week, MessMenuItem.DayOfWeek.TUESDAY)

    def test_menu_item_invalid_choice_fails_full_clean(self):
        mess = self.create_mess("1")
        item = MessMenuItem(
            mess=mess,
            item_name="Bad Item",
            description="",
            price=Decimal("15.00"),
            meal_type="brunch",
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=5,
            default_quantity=5,
            image_url="",
            is_active=True,
        )
        with self.assertRaises(ValidationError):
            item.full_clean()

    def test_menu_item_negative_available_quantity_fails(self):
        mess = self.create_mess("1A")
        with self.assertRaises(IntegrityError):
            self.create_menu_item(mess, "1A", available_quantity=-1)

    def test_menu_item_negative_default_quantity_fails(self):
        mess = self.create_mess("1B")
        with self.assertRaises(IntegrityError):
            self.create_menu_item(mess, "1B", default_quantity=-1)

    def test_menu_item_zero_quantities_are_allowed(self):
        mess = self.create_mess("1C")
        item = self.create_menu_item(mess, "1C", available_quantity=0, default_quantity=0)
        self.assertEqual(item.available_quantity, 0)
        self.assertEqual(item.default_quantity, 0)

    def test_booking_defaults_and_expiry_window(self):
        student = self.create_student("1")
        mess = self.create_mess("1")
        item = self.create_menu_item(mess, "1")
        now = timezone.now()
        booking = MessBooking.objects.create(
            student=student,
            menu_item=item,
            quantity=1,
            total_price=Decimal("40.00"),
            meal_type=item.meal_type,
            qr_code="qr-default-window-1",
        )
        self.assertEqual(booking.status, MessBooking.Status.PENDING)
        self.assertEqual(booking.booking_date, timezone.localdate())
        self.assertGreaterEqual(booking.qr_expires_at, now + timedelta(hours=2, minutes=59))
        self.assertLessEqual(booking.qr_expires_at, now + timedelta(hours=3, minutes=1))
        self.assertIsNone(booking.redeemed_by_staff)

    def test_booking_qr_code_must_be_unique(self):
        student = self.create_student("2")
        mess = self.create_mess("2")
        item = self.create_menu_item(mess, "2")
        MessBooking.objects.create(
            student=student,
            menu_item=item,
            quantity=1,
            total_price=Decimal("40.00"),
            meal_type=item.meal_type,
            qr_code="duplicate-qr-code",
        )
        with self.assertRaises(IntegrityError):
            MessBooking.objects.create(
                student=student,
                menu_item=item,
                quantity=1,
                total_price=Decimal("40.00"),
                meal_type=item.meal_type,
                qr_code="duplicate-qr-code",
            )

    def test_booking_quantity_must_be_greater_than_zero(self):
        student = self.create_student("3")
        mess = self.create_mess("3")
        item = self.create_menu_item(mess, "3")
        with self.assertRaises(IntegrityError):
            MessBooking.objects.create(
                student=student,
                menu_item=item,
                quantity=0,
                total_price=Decimal("0.00"),
                meal_type=item.meal_type,
                qr_code="quantity-zero-qr",
            )

    def test_booking_total_price_cannot_be_negative(self):
        student = self.create_student("4")
        mess = self.create_mess("4")
        item = self.create_menu_item(mess, "4")
        with self.assertRaises(IntegrityError):
            MessBooking.objects.create(
                student=student,
                menu_item=item,
                quantity=1,
                total_price=Decimal("-1.00"),
                meal_type=item.meal_type,
                qr_code="negative-total-qr",
            )

    def test_booking_invalid_status_fails_full_clean(self):
        student = self.create_student("4A")
        mess = self.create_mess("4A")
        item = self.create_menu_item(mess, "4A")
        booking = MessBooking(
            student=student,
            menu_item=item,
            quantity=1,
            total_price=Decimal("40.00"),
            meal_type=item.meal_type,
            qr_code="invalid-status-qr",
            status="used",
        )
        with self.assertRaises(ValidationError):
            booking.full_clean()

    def test_booking_ordering_newest_first(self):
        student = self.create_student("5")
        mess = self.create_mess("5")
        item = self.create_menu_item(mess, "5")
        older = MessBooking.objects.create(
            student=student,
            menu_item=item,
            quantity=1,
            total_price=Decimal("40.00"),
            meal_type=item.meal_type,
            qr_code="order-old",
        )
        newer = MessBooking.objects.create(
            student=student,
            menu_item=item,
            quantity=2,
            total_price=Decimal("80.00"),
            meal_type=item.meal_type,
            qr_code="order-new",
        )
        self.assertEqual(MessBooking.objects.first().id, newer.id)
        self.assertNotEqual(older.id, newer.id)

    def test_staff_assignment_unique_per_staff_mess_role(self):
        mess = self.create_mess("6")
        staff = self.create_staff("6", role=self.manager_role)
        MessStaffAssignment.objects.create(
            staff=staff,
            mess=mess,
            assignment_role=MessStaffAssignment.AssignmentRole.MANAGER,
            is_active=True,
        )
        with self.assertRaises(IntegrityError):
            MessStaffAssignment.objects.create(
                staff=staff,
                mess=mess,
                assignment_role=MessStaffAssignment.AssignmentRole.MANAGER,
                is_active=True,
            )

    def test_staff_assignment_allows_different_roles_for_same_staff_and_mess(self):
        mess = self.create_mess("7")
        staff = self.create_staff("7", role=self.worker_role)
        manager_assignment = MessStaffAssignment.objects.create(
            staff=staff,
            mess=mess,
            assignment_role=MessStaffAssignment.AssignmentRole.MANAGER,
            is_active=True,
        )
        worker_assignment = MessStaffAssignment.objects.create(
            staff=staff,
            mess=mess,
            assignment_role=MessStaffAssignment.AssignmentRole.WORKER,
            is_active=True,
        )
        self.assertNotEqual(manager_assignment.assignment_role, worker_assignment.assignment_role)

    def test_staff_assignment_invalid_role_fails_full_clean(self):
        mess = self.create_mess("8")
        staff = self.create_staff("8", role=self.worker_role)
        assignment = MessStaffAssignment(
            staff=staff,
            mess=mess,
            assignment_role="supervisor",
            is_active=True,
        )
        with self.assertRaises(ValidationError):
            assignment.full_clean()
