from django.utils import timezone
from rest_framework.test import APITestCase

from apps.canteen.models import Canteen
from apps.orders.models import CanteenOrder
from apps.users.models import Role, Staff, Student, User


class AuthSmokeTests(APITestCase):
    def test_register_requires_iitk_email(self):
        response = self.client.post("/api/auth/register/", {"email": "user@gmail.com", "password": "password123"})
        self.assertEqual(response.status_code, 400)


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
