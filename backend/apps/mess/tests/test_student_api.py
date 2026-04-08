from datetime import timedelta
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.mess.models import Mess, MessBooking, MessMenuItem
from apps.mess.services import create_booking
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessStudentAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student")
        cls.worker_role = Role.objects.create(role_name="mess_worker", description="Mess Worker")

    def setUp(self):
        # Avoid cross-test pollution from global API rate limiting middleware.
        cache.clear()

        self.student_user, self.student = self._create_student_user("1")
        self.other_student_user, self.other_student = self._create_student_user("2")
        self.worker_user, self.worker = self._create_worker_user("1")

        self.student_account = MessAccount.objects.create(student=self.student, balance=Decimal("500.00"))
        MessAccount.objects.create(student=self.other_student, balance=Decimal("500.00"))

        self.mess = Mess.objects.create(
            name="Hall Mess 1",
            location="Zone A",
            hall_name="Hall 1",
            is_active=True,
        )
        self.inactive_mess = Mess.objects.create(
            name="Hall Mess 2",
            location="Zone B",
            hall_name="Hall 2",
            is_active=False,
        )

        self.active_menu_item = MessMenuItem.objects.create(
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
        self.inactive_menu_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Aloo Paratha",
            description="Breakfast item",
            price=Decimal("30.00"),
            meal_type=MessMenuItem.MealType.BREAKFAST,
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=8,
            default_quantity=8,
            is_active=False,
        )
        self.active_different_day = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Veg Burger",
            description="Snack item",
            price=Decimal("50.00"),
            meal_type=MessMenuItem.MealType.SNACK,
            day_of_week=MessMenuItem.DayOfWeek.TUESDAY,
            available_quantity=5,
            default_quantity=6,
            is_active=True,
        )

    def _create_student_user(self, suffix):
        user = User.objects.create_user(
            email=f"student-api-{suffix}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        student = Student.objects.create(
            user=user,
            roll_number=f"ST-API-{suffix}",
            full_name=f"Student API {suffix}",
            hostel_name="Hall 1",
            room_number=f"{suffix}01",
        )
        return user, student

    def _create_worker_user(self, suffix):
        user = User.objects.create_user(
            email=f"worker-api-{suffix}@example.com",
            password="pass1234",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        worker = Staff.objects.create(
            user=user,
            full_name=f"Worker API {suffix}",
            employee_code=f"W-API-{suffix}",
            is_mess_staff=True,
        )
        return user, worker

    def _auth_student(self):
        self.client.force_authenticate(user=self.student_user)

    def _auth_other_student(self):
        self.client.force_authenticate(user=self.other_student_user)

    def _auth_worker(self):
        self.client.force_authenticate(user=self.worker_user)

    def test_student_routes_require_student_role(self):
        response_unauth = self.client.get("/api/mess/")
        self.assertEqual(response_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth_worker()
        response_worker = self.client.get("/api/mess/")
        self.assertEqual(response_worker.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_mess_returns_only_active_messes(self):
        self._auth_student()
        response = self.client.get("/api/mess/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.mess.id)

    def test_list_mess_uses_natural_hall_order(self):
        Mess.objects.create(
            name="Hall Mess 10",
            location="Zone C",
            hall_name="Hall 10",
            is_active=True,
        )
        Mess.objects.create(
            name="Hall Mess 3",
            location="Zone D",
            hall_name="Hall 3",
            is_active=True,
        )

        self._auth_student()
        response = self.client.get("/api/mess/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [mess["hall_name"] for mess in response.data],
            ["Hall 1", "Hall 3", "Hall 10"],
        )

    def test_menu_list_supports_filters(self):
        self._auth_student()
        response = self.client.get(
            f"/api/mess/{self.mess.id}/menu/",
            {"meal_type": "lunch", "day_of_week": "monday", "is_active": "true"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.active_menu_item.id)

    def test_menu_list_rejects_invalid_boolean_filter(self):
        self._auth_student()
        response = self.client.get(
            f"/api/mess/{self.mess.id}/menu/",
            {"is_active": "maybe"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("is_active", response.data)

    def test_create_booking_success_updates_balance_and_stock(self):
        self._auth_student()
        response = self.client.post(
            "/api/mess/extras/book/",
            {"menu_item": self.active_menu_item.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], MessBooking.Status.PENDING)
        self.assertEqual(response.data["total_price"], "80.00")

        self.student_account.refresh_from_db()
        self.active_menu_item.refresh_from_db()
        self.assertEqual(self.student_account.balance, Decimal("420.00"))
        self.assertEqual(self.active_menu_item.available_quantity, 8)

    def test_create_booking_rejects_inactive_menu_item(self):
        self._auth_student()
        response = self.client.post(
            "/api/mess/extras/book/",
            {"menu_item": self.inactive_menu_item.id, "quantity": 1},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("menu_item", response.data)

    def test_booking_list_is_scoped_to_current_student_and_newest_first(self):
        booking_1 = create_booking(self.student, self.active_menu_item.id, 1)
        booking_2 = create_booking(self.student, self.active_menu_item.id, 1)
        create_booking(self.other_student, self.active_menu_item.id, 1)

        self._auth_student()
        response = self.client.get("/api/mess/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], booking_2.id)
        self.assertEqual(response.data[1]["id"], booking_1.id)

    def test_booking_detail_does_not_allow_cross_student_access(self):
        other_booking = create_booking(self.other_student, self.active_menu_item.id, 1)
        self._auth_student()
        response = self.client.get(f"/api/mess/bookings/{other_booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cancel_booking_success_refunds_and_restores_inventory(self):
        booking = create_booking(self.student, self.active_menu_item.id, 2)

        self._auth_student()
        response = self.client.post(f"/api/mess/bookings/{booking.id}/cancel/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], MessBooking.Status.CANCELLED)

        self.student_account.refresh_from_db()
        self.active_menu_item.refresh_from_db()
        self.assertEqual(self.student_account.balance, Decimal("500.00"))
        self.assertEqual(self.active_menu_item.available_quantity, 10)

    def test_cancel_booking_rejects_expired_booking(self):
        booking = create_booking(self.student, self.active_menu_item.id, 1)
        booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=["qr_expires_at"])

        self._auth_student()
        response = self.client.post(f"/api/mess/bookings/{booking.id}/cancel/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_cancel_booking_cross_student_returns_not_found(self):
        booking = create_booking(self.other_student, self.active_menu_item.id, 1)

        self._auth_student()
        response = self.client.post(f"/api/mess/bookings/{booking.id}/cancel/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_booking_detail_success_for_owner(self):
        booking = create_booking(self.student, self.active_menu_item.id, 1)

        self._auth_student()
        response = self.client.get(f"/api/mess/bookings/{booking.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], booking.id)
        self.assertEqual(response.data["menu_item"]["id"], self.active_menu_item.id)
        self.assertIn("qr_payload", response.data)

    def test_booking_qr_image_success_for_owner(self):
        booking = create_booking(self.student, self.active_menu_item.id, 1)

        self._auth_student()
        response = self.client.get(f"/api/mess/bookings/{booking.id}/qr-image/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_booking_qr_image_does_not_allow_cross_student_access(self):
        other_booking = create_booking(self.other_student, self.active_menu_item.id, 1)

        self._auth_student()
        response = self.client.get(f"/api/mess/bookings/{other_booking.id}/qr-image/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_menu_list_defaults_to_active_items_only(self):
        self._auth_student()
        response = self.client.get(f"/api/mess/{self.mess.id}/menu/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data}
        self.assertIn(self.active_menu_item.id, returned_ids)
        self.assertIn(self.active_different_day.id, returned_ids)
        self.assertNotIn(self.inactive_menu_item.id, returned_ids)

    def test_inactive_mess_menu_returns_not_found(self):
        self._auth_student()
        response = self.client.get(f"/api/mess/{self.inactive_mess.id}/menu/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
