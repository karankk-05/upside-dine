from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Role, Staff, Student, User


class MeViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student")
        cls.manager_role = Role.objects.create(role_name="canteen_manager", description="Canteen Manager")

    def setUp(self):
        cache.clear()
        self.student_user = User.objects.create_user(
            email="me-student@example.com",
            password="pass1234",
            phone="9999999999",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        self.student_profile = Student.objects.create(
            user=self.student_user,
            roll_number="ME-STUDENT-1",
            full_name="Student Original",
            hostel_name="Hall 1",
            room_number="101",
        )

        self.staff_user = User.objects.create_user(
            email="me-staff@example.com",
            password="pass1234",
            phone="8888888888",
            role=self.manager_role,
            is_active=True,
            is_verified=True,
        )
        self.staff_profile = Staff.objects.create(
            user=self.staff_user,
            full_name="Manager Original",
            employee_code="MGR-1",
            is_mess_staff=False,
        )

    def test_get_me_returns_current_user_profile(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.student_user.email)
        self.assertEqual(response.data["profile"]["hostel_name"], "Hall 1")

    def test_student_can_update_phone_and_dining_settings(self):
        self.client.force_authenticate(user=self.student_user)
        payload = {
            "phone": "7000000000",
            "full_name": "Student Updated",
            "hostel_name": "Hall 2",
            "room_number": "202",
        }
        response = self.client.patch("/api/users/me/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student_user.refresh_from_db()
        self.student_profile.refresh_from_db()
        self.assertEqual(self.student_user.phone, "7000000000")
        self.assertEqual(self.student_profile.full_name, "Student Updated")
        self.assertEqual(self.student_profile.hostel_name, "Hall 2")
        self.assertEqual(self.student_profile.room_number, "202")

    def test_staff_can_update_name_and_phone(self):
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            "phone": "7111111111",
            "full_name": "Manager Updated",
        }
        response = self.client.patch("/api/users/me/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.staff_user.refresh_from_db()
        self.staff_profile.refresh_from_db()
        self.assertEqual(self.staff_user.phone, "7111111111")
        self.assertEqual(self.staff_profile.full_name, "Manager Updated")

    def test_staff_cannot_update_student_only_fields(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.patch(
            "/api/users/me/",
            {"hostel_name": "Hall 9"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("hostel_name", response.data)
