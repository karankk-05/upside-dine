from datetime import timedelta
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.mess.models import Mess, MessBooking, MessMenuItem, MessStaffAssignment
from apps.mess.services import create_booking
from apps.users.models import MessAccount, Role, Staff, Student, User


class MessManagerAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.student_role = Role.objects.create(role_name="student", description="Student role")
        cls.manager_role = Role.objects.create(role_name="mess_manager", description="Manager role")

    def setUp(self):
        cache.clear()
        self.manager_user, self.manager_staff = self._create_manager_user("1")
        MessStaffAssignment.objects.filter(staff=self.manager_staff).update(is_active=False)
        self.student_user, self.student = self._create_student_user("1")
        self.other_student_user, self.other_student = self._create_student_user("2")
        MessAccount.objects.create(student=self.student, balance=Decimal("10000.00"))
        MessAccount.objects.create(student=self.other_student, balance=Decimal("10000.00"))
        self.current_day = timezone.localdate().strftime("%A").lower()

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
        self.assignment = MessStaffAssignment.objects.create(
            staff=self.manager_staff,
            mess=self.mess,
            assignment_role=MessStaffAssignment.AssignmentRole.MANAGER,
            is_active=True,
        )

        self.menu_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Paneer Roll",
            description="Tasty roll",
            price=Decimal("40.00"),
            meal_type=MessMenuItem.MealType.LUNCH,
            day_of_week=self.current_day,
            available_quantity=300,
            default_quantity=320,
            is_active=True,
        )
        self.menu_item_inactive = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Aloo Paratha",
            description="Inactive item",
            price=Decimal("25.00"),
            meal_type=MessMenuItem.MealType.BREAKFAST,
            day_of_week=self.current_day,
            available_quantity=100,
            default_quantity=100,
            is_active=False,
        )
        self.other_mess_item = MessMenuItem.objects.create(
            mess=self.other_mess,
            item_name="Burger",
            description="Other mess item",
            price=Decimal("50.00"),
            meal_type=MessMenuItem.MealType.SNACK,
            day_of_week=self.current_day,
            available_quantity=200,
            default_quantity=200,
            is_active=True,
        )

    def _create_student_user(self, suffix):
        user = User.objects.create_user(
            email=f"manager-api-student-{suffix}@example.com",
            password="pass1234",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        student = Student.objects.create(
            user=user,
            roll_number=f"MANAGER-API-ST-{suffix}",
            full_name=f"Manager API Student {suffix}",
            hostel_name="Hall 1",
            room_number=f"{suffix}01",
        )
        return user, student

    def _create_manager_user(self, suffix):
        user = User.objects.create_user(
            email=f"manager-api-{suffix}@example.com",
            password="pass1234",
            role=self.manager_role,
            is_active=True,
            is_verified=True,
        )
        staff = Staff.objects.create(
            user=user,
            full_name=f"Manager API {suffix}",
            employee_code=f"MANAGER-API-{suffix}",
            is_mess_staff=True,
        )
        return user, staff

    def _auth_manager(self):
        self.client.force_authenticate(user=self.manager_user)

    def _auth_student(self):
        self.client.force_authenticate(user=self.student_user)

    def _create_and_set_booking_status(self, *, menu_item, quantity, booking_status, booking_date=None):
        booking = create_booking(self.student, menu_item.id, quantity)
        booking.status = booking_status
        update_fields = ["status", "updated_at"]

        if booking_date is not None:
            booking.booking_date = booking_date
            update_fields.append("booking_date")

        if booking_status == MessBooking.Status.REDEEMED:
            booking.redeemed_by_staff = self.manager_staff
            booking.redeemed_at = timezone.now()
            update_fields.extend(["redeemed_by_staff", "redeemed_at"])
        else:
            booking.redeemed_by_staff = None
            booking.redeemed_at = None
            update_fields.extend(["redeemed_by_staff", "redeemed_at"])

        booking.save(update_fields=list(dict.fromkeys(update_fields)))
        return booking

    def test_manager_routes_require_manager_role(self):
        response_unauth = self.client.get("/api/mess/manager/menu/")
        self.assertEqual(response_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth_student()
        response_student = self.client.get("/api/mess/manager/menu/")
        self.assertEqual(response_student.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_without_active_assignment_is_forbidden(self):
        self.assignment.is_active = False
        self.assignment.save(update_fields=["is_active", "updated_at"])

        self._auth_manager()
        response = self.client.get("/api/mess/manager/menu/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_with_multiple_assignments_requires_mess_id(self):
        MessStaffAssignment.objects.create(
            staff=self.manager_staff,
            mess=self.other_mess,
            assignment_role=MessStaffAssignment.AssignmentRole.MANAGER,
            is_active=True,
        )
        self._auth_manager()

        response_without_mess = self.client.get("/api/mess/manager/menu/")
        self.assertEqual(response_without_mess.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mess_id", response_without_mess.data)

        response_with_mess = self.client.get("/api/mess/manager/menu/", {"mess_id": self.other_mess.id})
        self.assertEqual(response_with_mess.status_code, status.HTTP_200_OK)

    def test_manager_menu_list_scoped_to_assigned_mess(self):
        self._auth_manager()
        response = self.client.get("/api/mess/manager/menu/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertIn(self.menu_item.id, returned_ids)
        self.assertNotIn(self.menu_item_inactive.id, returned_ids)
        self.assertNotIn(self.other_mess_item.id, returned_ids)

    def test_manager_menu_list_can_filter_inactive_items(self):
        self._auth_manager()
        response = self.client.get("/api/mess/manager/menu/", {"is_active": "false"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertIn(self.menu_item_inactive.id, returned_ids)
        self.assertNotIn(self.menu_item.id, returned_ids)
        self.assertNotIn(self.other_mess_item.id, returned_ids)

    def test_manager_menu_filter_by_meal_type(self):
        self._auth_manager()
        response = self.client.get("/api/mess/manager/menu/", {"meal_type": "lunch"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.menu_item.id)

    def test_manager_menu_filter_rejects_invalid_value(self):
        self._auth_manager()
        response = self.client.get("/api/mess/manager/menu/", {"meal_type": "invalid"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meal_type", response.data)

    def test_manager_create_menu_item_success(self):
        self._auth_manager()
        payload = {
            "item_name": "Chole Bhature",
            "description": "Special lunch item",
            "price": "60.00",
            "meal_type": MessMenuItem.MealType.LUNCH,
            "day_of_week": MessMenuItem.DayOfWeek.WEDNESDAY,
            "available_quantity": 80,
            "default_quantity": 90,
            "is_active": True,
        }
        response = self.client.post("/api/mess/manager/menu/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["mess"], self.mess.id)
        self.assertEqual(response.data["item_name"], "Chole Bhature")

    def test_manager_create_menu_item_rejects_foreign_mess(self):
        self._auth_manager()
        payload = {
            "mess": self.other_mess.id,
            "item_name": "Rajma Chawal",
            "description": "Special meal",
            "price": "70.00",
            "meal_type": MessMenuItem.MealType.LUNCH,
            "day_of_week": MessMenuItem.DayOfWeek.THURSDAY,
            "available_quantity": 50,
            "default_quantity": 60,
            "is_active": True,
        }
        response = self.client.post("/api/mess/manager/menu/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mess", response.data)

    def test_manager_patch_menu_item_success(self):
        self._auth_manager()
        response = self.client.patch(
            f"/api/mess/manager/menu/{self.menu_item.id}/",
            {"available_quantity": 250, "price": "42.50"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["available_quantity"], 250)
        self.assertEqual(response.data["price"], "42.50")

    def test_manager_patch_menu_item_cannot_change_mess(self):
        self._auth_manager()
        response = self.client.patch(
            f"/api/mess/manager/menu/{self.menu_item.id}/",
            {"mess": self.other_mess.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mess", response.data)

    def test_manager_patch_menu_item_outside_scope_not_found(self):
        self._auth_manager()
        response = self.client.patch(
            f"/api/mess/manager/menu/{self.other_mess_item.id}/",
            {"available_quantity": 150},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_delete_menu_item_soft_deletes(self):
        self._auth_manager()
        response = self.client.delete(f"/api/mess/manager/menu/{self.menu_item.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.menu_item.refresh_from_db()
        self.assertFalse(self.menu_item.is_active)

        list_response = self.client.get("/api/mess/manager/menu/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in list_response.data}
        self.assertNotIn(self.menu_item.id, returned_ids)

    def test_manager_bookings_default_today_with_stats(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.PENDING,
            booking_date=today,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=2,
            booking_status=MessBooking.Status.REDEEMED,
            booking_date=today,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.CANCELLED,
            booking_date=today,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.EXPIRED,
            booking_date=today,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.PENDING,
            booking_date=yesterday,
        )
        self._create_and_set_booking_status(
            menu_item=self.other_mess_item,
            quantity=1,
            booking_status=MessBooking.Status.PENDING,
            booking_date=today,
        )

        self._auth_manager()
        response = self.client.get("/api/mess/manager/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stats"]["total"], 4)
        self.assertEqual(response.data["stats"][MessBooking.Status.PENDING], 1)
        self.assertEqual(response.data["stats"][MessBooking.Status.REDEEMED], 1)
        self.assertEqual(response.data["stats"][MessBooking.Status.CANCELLED], 1)
        self.assertEqual(response.data["stats"][MessBooking.Status.EXPIRED], 1)
        self.assertEqual(len(response.data["results"]), 4)

    def test_manager_bookings_support_status_and_date_filter(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)

        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.PENDING,
            booking_date=today,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=2,
            booking_status=MessBooking.Status.REDEEMED,
            booking_date=today,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.PENDING,
            booking_date=yesterday,
        )

        self._auth_manager()
        redeemed_response = self.client.get("/api/mess/manager/bookings/", {"status": "redeemed"})
        self.assertEqual(redeemed_response.status_code, status.HTTP_200_OK)
        self.assertEqual(redeemed_response.data["stats"]["total"], 1)
        self.assertEqual(redeemed_response.data["results"][0]["status"], MessBooking.Status.REDEEMED)

        yesterday_response = self.client.get(
            "/api/mess/manager/bookings/",
            {"booking_date": yesterday.isoformat()},
        )
        self.assertEqual(yesterday_response.status_code, status.HTTP_200_OK)
        self.assertEqual(yesterday_response.data["stats"]["total"], 1)
        self.assertEqual(yesterday_response.data["results"][0]["booking_date"], yesterday.isoformat())

    def test_manager_bookings_invalid_filter_returns_400(self):
        self._auth_manager()
        response = self.client.get("/api/mess/manager/bookings/", {"status": "not_a_real_status"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_manager_stats_returns_revenue_and_popular_item(self):
        alt_item = MessMenuItem.objects.create(
            mess=self.mess,
            item_name="Veg Noodles",
            description="Snack special",
            price=Decimal("70.00"),
            meal_type=MessMenuItem.MealType.SNACK,
            day_of_week=self.current_day,
            available_quantity=100,
            default_quantity=100,
            is_active=True,
        )

        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=3,
            booking_status=MessBooking.Status.REDEEMED,
        )
        self._create_and_set_booking_status(
            menu_item=self.menu_item,
            quantity=1,
            booking_status=MessBooking.Status.CANCELLED,
        )
        self._create_and_set_booking_status(
            menu_item=alt_item,
            quantity=1,
            booking_status=MessBooking.Status.REDEEMED,
        )
        self._create_and_set_booking_status(
            menu_item=self.other_mess_item,
            quantity=5,
            booking_status=MessBooking.Status.REDEEMED,
        )

        self._auth_manager()
        response = self.client.get("/api/mess/manager/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_bookings"], 3)
        self.assertEqual(response.data["total_redeemed"], 2)
        self.assertEqual(response.data["total_cancelled"], 1)
        self.assertEqual(response.data["total_revenue"], "190.00")
        self.assertEqual(response.data["most_popular_item"]["menu_item_id"], self.menu_item.id)
        self.assertEqual(response.data["most_popular_item"]["total_quantity"], 4)

    def test_manager_inventory_get_is_scoped(self):
        self._auth_manager()
        response = self.client.get("/api/mess/manager/inventory/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {item["id"] for item in response.data}
        self.assertIn(self.menu_item.id, returned_ids)
        self.assertNotIn(self.other_mess_item.id, returned_ids)

    def test_manager_inventory_patch_updates_values(self):
        self._auth_manager()
        response = self.client.patch(
            "/api/mess/manager/inventory/",
            {"menu_item_id": self.menu_item.id, "available_quantity": 222, "default_quantity": 250},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["available_quantity"], 222)
        self.assertEqual(response.data["default_quantity"], 250)

    def test_manager_inventory_patch_requires_menu_item_id(self):
        self._auth_manager()
        response = self.client.patch(
            "/api/mess/manager/inventory/",
            {"available_quantity": 50},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("menu_item_id", response.data)

    def test_manager_inventory_patch_rejects_invalid_values(self):
        self._auth_manager()
        response = self.client.patch(
            "/api/mess/manager/inventory/",
            {"menu_item_id": self.menu_item.id, "available_quantity": -1},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("available_quantity", response.data)

    def test_manager_inventory_patch_outside_scope_not_found(self):
        self._auth_manager()
        response = self.client.patch(
            "/api/mess/manager/inventory/",
            {"menu_item_id": self.other_mess_item.id, "available_quantity": 99},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
