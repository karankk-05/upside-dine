from datetime import timedelta
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.mess.models import Mess, MessBooking, MessMenuItem, MessStaffAssignment
from apps.mess.services import create_booking, redeem_booking
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessWorkerAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student role")
        cls.worker_role = Role.objects.create(role_name="mess_worker", description="Worker role")

    def setUp(self):
        cache.clear()
        self.worker_user, self.worker_staff = self._create_worker_user("1")
        self.other_worker_user, self.other_worker_staff = self._create_worker_user("2")
        self.student_user, self.student = self._create_student_user("1")
        MessAccount.objects.create(student=self.student, balance=Decimal("10000.00"))

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

        MessStaffAssignment.objects.create(
            staff=self.worker_staff,
            mess=self.mess,
            assignment_role=MessStaffAssignment.AssignmentRole.WORKER,
            is_active=True,
        )
        MessStaffAssignment.objects.create(
            staff=self.other_worker_staff,
            mess=self.other_mess,
            assignment_role=MessStaffAssignment.AssignmentRole.WORKER,
            is_active=True,
        )

        self.menu_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Paneer Roll",
            description="Main item",
            price=Decimal("40.00"),
            meal_type=MessMenuItem.MealType.LUNCH,
            day_of_week=MessMenuItem.DayOfWeek.MONDAY,
            available_quantity=300,
            default_quantity=300,
            is_active=True,
        )
        self.other_mess_item = MessMenuItem.objects.create(
            mess=self.other_mess,
            item_name="Veg Burger",
            description="Other mess item",
            price=Decimal("50.00"),
            meal_type=MessMenuItem.MealType.SNACK,
            day_of_week=MessMenuItem.DayOfWeek.TUESDAY,
            available_quantity=300,
            default_quantity=300,
            is_active=True,
        )

    def _create_student_user(self, suffix):
        user = User.objects.create_user(
            email=f"worker-api-student-{suffix}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        student = Student.objects.create(
            user=user,
            roll_number=f"WORKER-ST-{suffix}",
            full_name=f"Worker API Student {suffix}",
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
        staff = Staff.objects.create(
            user=user,
            full_name=f"Worker API {suffix}",
            employee_code=f"W-API-{suffix}",
            is_mess_staff=True,
        )
        return user, staff

    def _auth_worker(self):
        self.client.force_authenticate(user=self.worker_user)

    def _auth_student(self):
        self.client.force_authenticate(user=self.student_user)

    def test_worker_routes_require_worker_role(self):
        response_unauth = self.client.post("/api/mess/worker/verify/", {}, format="json")
        self.assertEqual(response_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth_student()
        response_student = self.client.post("/api/mess/worker/verify/", {}, format="json")
        self.assertEqual(response_student.status_code, status.HTTP_403_FORBIDDEN)

    def test_worker_without_active_assignment_is_forbidden(self):
        assignment = MessStaffAssignment.objects.get(staff=self.worker_staff)
        assignment.is_active = False
        assignment.save(update_fields=["is_active", "updated_at"])

        self._auth_worker()
        response = self.client.post("/api/mess/worker/verify/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_worker_with_multiple_assignments_requires_mess_id(self):
        MessStaffAssignment.objects.create(
            staff=self.worker_staff,
            mess=self.other_mess,
            assignment_role=MessStaffAssignment.AssignmentRole.WORKER,
            is_active=True,
        )
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        self._auth_worker()

        response_without_mess = self.client.post(
            "/api/mess/worker/verify/",
            {"booking_id": booking.id},
            format="json",
        )
        self.assertEqual(response_without_mess.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mess_id", response_without_mess.data)

        response_with_mess = self.client.post(
            "/api/mess/worker/verify/",
            {"booking_id": booking.id, "mess_id": self.mess.id},
            format="json",
        )
        self.assertEqual(response_with_mess.status_code, status.HTTP_200_OK)

    def test_worker_scan_history_with_multiple_assignments_requires_mess_id(self):
        MessStaffAssignment.objects.create(
            staff=self.worker_staff,
            mess=self.other_mess,
            assignment_role=MessStaffAssignment.AssignmentRole.WORKER,
            is_active=True,
        )
        self._auth_worker()
        response = self.client.get("/api/mess/worker/scan-history/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mess_id", response.data)

    def test_verify_booking_success_by_booking_id(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)

        self._auth_worker()
        response = self.client.post(
            "/api/mess/worker/verify/",
            {"booking_id": booking.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], MessBooking.Status.REDEEMED)
        self.assertEqual(response.data["redeemed_by_staff"]["id"], self.worker_staff.id)

    def test_verify_booking_success_by_qr_code(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)

        self._auth_worker()
        response = self.client.post(
            "/api/mess/worker/verify/",
            {"qr_code": booking.qr_code},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], MessBooking.Status.REDEEMED)

    def test_verify_requires_exactly_one_identifier(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)

        self._auth_worker()
        none_response = self.client.post("/api/mess/worker/verify/", {}, format="json")
        self.assertEqual(none_response.status_code, status.HTTP_400_BAD_REQUEST)

        both_response = self.client.post(
            "/api/mess/worker/verify/",
            {"booking_id": booking.id, "qr_code": booking.qr_code},
            format="json",
        )
        self.assertEqual(both_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_invalid_qr_returns_400(self):
        self._auth_worker()
        response = self.client.post(
            "/api/mess/worker/verify/",
            {"qr_code": "invalid-qr"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("qr_code", response.data)

    def test_verify_cross_mess_booking_rejected(self):
        booking = create_booking(self.student, self.other_mess_item.id, quantity=1)

        self._auth_worker()
        response = self.client.post(
            "/api/mess/worker/verify/",
            {"booking_id": booking.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_verify_duplicate_redemption_rejected(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)

        self._auth_worker()
        first = self.client.post("/api/mess/worker/verify/", {"booking_id": booking.id}, format="json")
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.post("/api/mess/worker/verify/", {"booking_id": booking.id}, format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", second.data)

    def test_verify_expired_booking_rejected(self):
        booking = create_booking(self.student, self.menu_item.id, quantity=1)
        booking.qr_expires_at = timezone.now() - timedelta(minutes=1)
        booking.save(update_fields=["qr_expires_at"])

        self._auth_worker()
        response = self.client.post(
            "/api/mess/worker/verify/",
            {"booking_id": booking.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

        booking.refresh_from_db()
        self.assertEqual(booking.status, MessBooking.Status.PENDING)

    def test_scan_history_returns_recent_scans_for_current_worker(self):
        booking_1 = create_booking(self.student, self.menu_item.id, quantity=1)
        booking_2 = create_booking(self.student, self.menu_item.id, quantity=1)

        self._auth_worker()
        self.client.post("/api/mess/worker/verify/", {"booking_id": booking_1.id}, format="json")
        self.client.post("/api/mess/worker/verify/", {"booking_id": booking_2.id}, format="json")

        response = self.client.get("/api/mess/worker/scan-history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], booking_2.id)
        self.assertEqual(response.data[1]["id"], booking_1.id)

    def test_scan_history_fallback_query_when_cache_is_empty(self):
        booking_1 = create_booking(self.student, self.menu_item.id, quantity=1)
        booking_2 = create_booking(self.student, self.menu_item.id, quantity=1)
        redeem_booking(booking_1.id, staff=self.worker_staff, qr_code=booking_1.qr_code)
        redeem_booking(booking_2.id, staff=self.worker_staff, qr_code=booking_2.qr_code)
        cache.clear()

        self._auth_worker()
        response = self.client.get("/api/mess/worker/scan-history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        returned_ids = {item["id"] for item in response.data}
        self.assertEqual(returned_ids, {booking_1.id, booking_2.id})

    def test_scan_history_scoped_to_worker_and_mess(self):
        booking_for_worker_1 = create_booking(self.student, self.menu_item.id, quantity=1)
        booking_for_worker_2 = create_booking(self.student, self.other_mess_item.id, quantity=1)
        redeem_booking(booking_for_worker_1.id, staff=self.worker_staff, qr_code=booking_for_worker_1.qr_code)
        redeem_booking(
            booking_for_worker_2.id,
            staff=self.other_worker_staff,
            qr_code=booking_for_worker_2.qr_code,
        )
        cache.clear()

        self._auth_worker()
        response = self.client.get("/api/mess/worker/scan-history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], booking_for_worker_1.id)
