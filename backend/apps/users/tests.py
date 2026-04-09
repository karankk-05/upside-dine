from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.canteen.models import Canteen
from apps.mess.models import Mess, MessStaffAssignment
from apps.orders.models import CanteenOrder
from apps.users.models import Role, Staff, Student, User


class AuthSmokeTests(APITestCase):
    def test_register_requires_iitk_email(self):
        response = self.client.post("/api/auth/register/", {"email": "user@gmail.com", "password": "password123"})
        self.assertEqual(response.status_code, 400)

    def test_register_student_rejects_duplicate_roll_number_cleanly(self):
        student_role = Role.objects.create(role_name="student")
        existing_user = User.objects.create_user(
            email="existing@iitk.ac.in",
            password="password123",
            role=student_role,
            is_active=True,
            is_verified=True,
        )
        Student.objects.create(
            user=existing_user,
            roll_number="230546",
            full_name="Existing Student",
            hostel_name="Hall 4",
            room_number="A101",
        )
        User.objects.create_user(
            email="retry@iitk.ac.in",
            password="password123",
            role=student_role,
            is_active=False,
            is_verified=False,
        )

        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "retry@iitk.ac.in",
                "password": "password123",
                "phone": "9156718623",
                "role_name": "student",
                "full_name": "Asta",
                "roll_number": "230546",
                "hostel_name": "Hall 4",
                "room_number": "E106",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["roll_number"][0],
            "This roll number is already associated with another student account.",
        )

    @patch("apps.users.views.send_otp_email")
    def test_register_unverified_student_updates_existing_profile(self, mock_send_otp_email):
        student_role = Role.objects.create(role_name="student")
        retry_user = User.objects.create_user(
            email="retry@iitk.ac.in",
            password="oldpassword123",
            role=student_role,
            is_active=False,
            is_verified=False,
        )
        Student.objects.create(
            user=retry_user,
            roll_number="230100",
            full_name="Old Name",
            hostel_name="Hall 1",
            room_number="A101",
        )

        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "retry@iitk.ac.in",
                "password": "password123",
                "phone": "9156718623",
                "role_name": "student",
                "full_name": "Updated Name",
                "roll_number": "230100",
                "hostel_name": "Hall 4",
                "room_number": "E106",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        retry_user.refresh_from_db()
        retry_user.student_profile.refresh_from_db()
        self.assertEqual(retry_user.student_profile.full_name, "Updated Name")
        self.assertEqual(retry_user.student_profile.hostel_name, "Hall 4")
        self.assertEqual(retry_user.student_profile.room_number, "E106")
        self.assertEqual(retry_user.phone, "9156718623")
        mock_send_otp_email.assert_called_once()

    def test_public_halls_are_naturally_sorted(self):
        Mess.objects.create(hall_name="Hall 10", location="Zone 10", is_active=True)
        Mess.objects.create(hall_name="Hall 2", location="Zone 2", is_active=True)
        Mess.objects.create(hall_name="Hall 1", location="Zone 1", is_active=True)

        response = self.client.get("/api/public/halls/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[:3], ["Hall 1", "Hall 2", "Hall 10"])

    def test_public_canteens_are_naturally_sorted(self):
        Canteen.objects.create(name="Hall 10 Canteen", location="Hall 10", is_active=True)
        Canteen.objects.create(name="Hall 2 Canteen", location="Hall 2", is_active=True)
        Canteen.objects.create(name="Hall 1 Canteen", location="Hall 1", is_active=True)

        response = self.client.get("/api/public/canteens/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [canteen["name"] for canteen in response.data[:3]],
            ["Hall 1 Canteen", "Hall 2 Canteen", "Hall 10 Canteen"],
        )


class DeliveryPersonnelManagementTests(APITestCase):
    def setUp(self):
        self.canteen = Canteen.objects.create(name="Hall 2 Canteen", location="Hall 2")
        self.canteen_manager_role = Role.objects.create(role_name="canteen_manager")
        self.delivery_role = Role.objects.create(role_name="delivery_person")
        self.student_role = Role.objects.create(role_name="student")

        self.manager = User.objects.create_user(
            email="manager@example.com",
            password="password123",
            role=self.canteen_manager_role,
            is_active=True,
            is_verified=True,
        )
        Staff.objects.create(
            user=self.manager,
            full_name="Canteen Manager",
            employee_code="CM001",
            canteen=self.canteen,
        )

        self.delivery_person = User.objects.create_user(
            email="delivery@example.com",
            password="password123",
            role=self.delivery_role,
            is_active=True,
            is_verified=True,
        )
        Staff.objects.create(
            user=self.delivery_person,
            full_name="Delivery Person",
            employee_code="DEL001",
            canteen=self.canteen,
        )

        self.student_user = User.objects.create_user(
            email="student@iitk.ac.in",
            password="password123",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        self.student = Student.objects.create(
            user=self.student_user,
            roll_number="23001",
            full_name="Test Student",
        )

        self.order = CanteenOrder.objects.create(
            order_number="UD-TEST-0001",
            student=self.student,
            canteen=self.canteen,
            order_type=CanteenOrder.ORDER_TYPE_DELIVERY,
            subtotal="100.00",
            delivery_fee="20.00",
            total_amount="120.00",
            status=CanteenOrder.STATUS_OUT_FOR_DELIVERY,
            delivery_address="Hall 2",
            pickup_otp="123456",
            delivery_person=self.delivery_person,
            delivery_accepted_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.manager)

    def test_delete_delivery_person_releases_active_orders(self):
        response = self.client.delete(f"/api/manager/delivery-personnel/{self.delivery_person.id}/toggle/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=self.delivery_person.id).exists())

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, CanteenOrder.STATUS_READY)
        self.assertIsNone(self.order.delivery_person)
        self.assertIsNone(self.order.delivery_accepted_at)


class MessWorkerManagementTests(APITestCase):
    def setUp(self):
        self.mess = Mess.objects.create(hall_name="Hall 7", location="Zone A", is_active=True)
        self.other_mess = Mess.objects.create(hall_name="Hall 8", location="Zone B", is_active=True)
        self.manager_role = Role.objects.create(role_name="mess_manager")
        self.worker_role = Role.objects.create(role_name="mess_worker")
        self.student_role = Role.objects.create(role_name="student")

        self.manager = User.objects.create_user(
            email="mess.manager@example.com",
            password="password123",
            role=self.manager_role,
            is_active=True,
            is_verified=True,
        )
        self.manager_staff = Staff.objects.create(
            user=self.manager,
            full_name="Mess Manager",
            employee_code="MM001",
            is_mess_staff=True,
        )
        MessStaffAssignment.objects.filter(staff=self.manager_staff).update(is_active=False)
        MessStaffAssignment.objects.create(
            staff=self.manager_staff,
            mess=self.mess,
            assignment_role="manager",
            is_active=True,
        )

        self.worker = User.objects.create_user(
            email="worker.one@example.com",
            password="password123",
            phone="9999999999",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        self.worker_staff = Staff.objects.create(
            user=self.worker,
            full_name="Worker One",
            employee_code="MW001",
            is_mess_staff=True,
        )
        MessStaffAssignment.objects.create(
            staff=self.worker_staff,
            mess=self.mess,
            assignment_role="worker",
            is_active=True,
        )

        self.other_worker = User.objects.create_user(
            email="worker.two@example.com",
            password="password123",
            phone="8888888888",
            role=self.worker_role,
            is_active=True,
            is_verified=True,
        )
        self.other_worker_staff = Staff.objects.create(
            user=self.other_worker,
            full_name="Worker Two",
            employee_code="MW002",
            is_mess_staff=True,
        )
        MessStaffAssignment.objects.create(
            staff=self.other_worker_staff,
            mess=self.other_mess,
            assignment_role="worker",
            is_active=True,
        )

        self.duplicate_user = User.objects.create_user(
            email="duplicate@example.com",
            password="password123",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )

        self.client.force_authenticate(user=self.manager)

    def test_manager_can_update_mess_worker_details(self):
        response = self.client.patch(
            f"/api/manager/mess-workers/{self.worker.id}/",
            {
                "full_name": "Updated Worker",
                "email": "updated.worker@example.com",
                "phone": "7777777777",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.worker.refresh_from_db()
        self.worker_staff.refresh_from_db()
        self.assertEqual(self.worker.email, "updated.worker@example.com")
        self.assertEqual(self.worker.phone, "7777777777")
        self.assertEqual(self.worker_staff.full_name, "Updated Worker")
        self.assertEqual(response.data["email"], "updated.worker@example.com")
        self.assertEqual(response.data["phone"], "7777777777")
        self.assertEqual(response.data["full_name"], "Updated Worker")

    def test_manager_update_rejects_duplicate_worker_email(self):
        response = self.client.patch(
            f"/api/manager/mess-workers/{self.worker.id}/",
            {"email": self.duplicate_user.email},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.worker.refresh_from_db()
        self.assertEqual(self.worker.email, "worker.one@example.com")

    def test_manager_cannot_update_worker_from_other_mess(self):
        response = self.client.patch(
            f"/api/manager/mess-workers/{self.other_worker.id}/",
            {"full_name": "No Access"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)


class AdminManagerManagementTests(APITestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(role_name="admin_manager")
        self.mess_manager_role = Role.objects.create(role_name="mess_manager")
        self.canteen_manager_role = Role.objects.create(role_name="canteen_manager")

        self.admin_user = User.objects.create_user(
            email="admin.manager@example.com",
            password="password123",
            role=self.admin_role,
            is_active=True,
            is_verified=True,
        )
        self.client.force_authenticate(user=self.admin_user)

        self.mess = Mess.objects.create(hall_name="Hall 1", location="North Block")
        self.other_mess = Mess.objects.create(hall_name="Hall 2", location="South Block")
        self.canteen = Canteen.objects.create(name="North Canteen", location="Hall 1")

        self.manager = User.objects.create_user(
            email="manager.one@example.com",
            password="password123",
            phone="9999999999",
            role=self.mess_manager_role,
            is_active=True,
            is_verified=True,
        )
        self.manager_staff = Staff.objects.create(
            user=self.manager,
            full_name="Manager One",
            employee_code="ADM001",
            is_mess_staff=True,
        )
        MessStaffAssignment.objects.filter(staff=self.manager_staff).update(is_active=False)
        MessStaffAssignment.objects.create(
            staff=self.manager_staff,
            mess=self.mess,
            assignment_role="manager",
            is_active=True,
        )

        self.duplicate_user = User.objects.create_user(
            email="taken@example.com",
            password="password123",
            role=self.admin_role,
            is_active=True,
            is_verified=True,
        )

    def test_admin_can_update_manager_details_and_assignment(self):
        response = self.client.put(
            f"/api/admin/managers/{self.manager.id}/",
            {
                "full_name": "Updated Manager",
                "email": "updated.manager@example.com",
                "phone": "8888888888",
                "role_name": "canteen_manager",
                "canteen_id": self.canteen.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.manager.refresh_from_db()
        self.manager_staff.refresh_from_db()
        self.assertEqual(self.manager.email, "updated.manager@example.com")
        self.assertEqual(self.manager.phone, "8888888888")
        self.assertEqual(self.manager.role.role_name, "canteen_manager")
        self.assertEqual(self.manager_staff.full_name, "Updated Manager")
        self.assertEqual(self.manager_staff.canteen, self.canteen)
        self.assertFalse(self.manager_staff.is_mess_staff)
        self.assertFalse(
            MessStaffAssignment.objects.filter(
                staff=self.manager_staff,
                assignment_role="manager",
                is_active=True,
            ).exists()
        )
        self.assertEqual(response.data["assignment_name"], self.canteen.name)
        self.assertEqual(response.data["canteen_id"], self.canteen.id)
        self.assertIsNone(response.data["mess_id"])

    def test_admin_can_reassign_manager_to_another_mess(self):
        response = self.client.put(
            f"/api/admin/managers/{self.manager.id}/",
            {
                "full_name": "Manager One",
                "email": "manager.one@example.com",
                "phone": "9999999999",
                "role_name": "mess_manager",
                "mess_id": self.other_mess.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        active_assignment = MessStaffAssignment.objects.get(
            staff=self.manager_staff,
            assignment_role="manager",
            is_active=True,
        )
        self.assertEqual(active_assignment.mess, self.other_mess)
        self.assertEqual(response.data["mess_id"], self.other_mess.id)
        self.assertEqual(response.data["assignment_name"], self.other_mess.name)

    def test_admin_update_rejects_duplicate_manager_email(self):
        response = self.client.put(
            f"/api/admin/managers/{self.manager.id}/",
            {
                "full_name": "Manager One",
                "email": self.duplicate_user.email,
                "phone": "9999999999",
                "role_name": "mess_manager",
                "mess_id": self.mess.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.manager.refresh_from_db()
        self.assertEqual(self.manager.email, "manager.one@example.com")

    def test_admin_can_delete_manager(self):
        response = self.client.delete(f"/api/admin/managers/{self.manager.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=self.manager.id).exists())


class AdminMessManagementTests(APITestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(role_name="admin_manager")
        self.admin_user = User.objects.create_user(
            email="admin.manager@example.com",
            password="password123",
            role=self.admin_role,
            is_active=True,
            is_verified=True,
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_admin_can_update_mess_details(self):
        mess = Mess.objects.create(hall_name="Hall 1", location="North Block")

        response = self.client.put(
            f"/api/admin/messes/{mess.id}/",
            {"hall_name": "Hall 1 Extension", "location": "East Wing"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        mess.refresh_from_db()
        self.assertEqual(mess.hall_name, "Hall 1 Extension")
        self.assertEqual(mess.name, "Hall 1 Extension Mess")
        self.assertEqual(mess.location, "East Wing")
        self.assertEqual(response.data["name"], "Hall 1 Extension Mess")
        self.assertEqual(response.data["location"], "East Wing")

    def test_admin_update_rejects_duplicate_hall_name(self):
        Mess.objects.create(hall_name="Hall 1", location="North Block")
        mess = Mess.objects.create(hall_name="Hall 2", location="South Block")

        response = self.client.put(
            f"/api/admin/messes/{mess.id}/",
            {"hall_name": "Hall 1", "location": "South Block"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("hall_name", response.data)
        mess.refresh_from_db()
        self.assertEqual(mess.hall_name, "Hall 2")

    def test_admin_can_toggle_mess_status(self):
        mess = Mess.objects.create(hall_name="Hall 3", location="Central Block")

        response = self.client.patch(f"/api/admin/messes/{mess.id}/", {}, format="json")

        self.assertEqual(response.status_code, 200)
        mess.refresh_from_db()
        self.assertFalse(mess.is_active)
        self.assertEqual(response.data["is_active"], False)


class AdminCanteenManagementTests(APITestCase):
    def setUp(self):
        self.admin_role = Role.objects.create(role_name="admin_manager")
        self.admin_user = User.objects.create_user(
            email="admin.canteen@example.com",
            password="password123",
            role=self.admin_role,
            is_active=True,
            is_verified=True,
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_admin_can_toggle_canteen_status(self):
        canteen = Canteen.objects.create(name="Issue 2 Canteen", location="North Block")

        response = self.client.patch(f"/api/admin/canteens/{canteen.id}/", {}, format="json")

        self.assertEqual(response.status_code, 200)
        canteen.refresh_from_db()
        self.assertFalse(canteen.is_active)
        self.assertEqual(response.data["is_active"], False)

    def test_admin_can_delete_canteen(self):
        canteen = Canteen.objects.create(name="Issue 2 Delete Canteen", location="South Block")

        response = self.client.delete(f"/api/admin/canteens/{canteen.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Canteen.objects.filter(id=canteen.id).exists())
