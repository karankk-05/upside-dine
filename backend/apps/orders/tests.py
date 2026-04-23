from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.canteen.models import Canteen, CanteenMenuItem
from apps.payments.models import Payment
from apps.users.models import Role, Staff, Student, User

from .models import CanteenOrder, CanteenOrderItem
from .services import cancel_order, create_order_for_student


class OrderServiceSmokeTests(TestCase):
    def setUp(self):
        role = Role.objects.create(role_name="student")
        self.user = User.objects.create_user(email="student@iitk.ac.in", password="password123", role=role)
        self.student = Student.objects.create(
            user=self.user,
            roll_number="23001",
            full_name="Test Student",
        )
        self.canteen = Canteen.objects.create(
            name="Hall 2 Canteen",
            location="Hall 2",
            opening_time="08:00",
            closing_time="22:00",
        )
        self.item = CanteenMenuItem.objects.create(
            canteen=self.canteen,
            item_name="Paneer Roll",
            price="60.00",
            preparation_time_mins=12,
            available_quantity=10,
        )

    def test_create_pickup_order(self):
        order = create_order_for_student(
            self.student,
            {
                "canteen_id": self.canteen.id,
                "order_type": "pickup",
                "items": [{"menu_item_id": self.item.id, "quantity": 2}],
            },
        )
        self.assertEqual(order.total_amount, order.subtotal)
        self.assertEqual(order.items.count(), 1)

    def test_cancelling_order_restores_inventory(self):
        order = create_order_for_student(
            self.student,
            {
                "canteen_id": self.canteen.id,
                "order_type": "pickup",
                "items": [{"menu_item_id": self.item.id, "quantity": 2}],
            },
        )

        self.item.refresh_from_db()
        self.assertEqual(self.item.available_quantity, 8)

        cancel_order(order, "Payment not completed")

        self.item.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(order.status, CanteenOrder.STATUS_CANCELLED)
        self.assertEqual(self.item.available_quantity, 10)


class StudentOrderVisibilityApiTests(APITestCase):
    def setUp(self):
        self.student_role = Role.objects.create(role_name="student")
        self.user = User.objects.create_user(
            email="visibility.student@iitk.ac.in",
            password="password123",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        self.student = Student.objects.create(
            user=self.user,
            roll_number="VIS001",
            full_name="Visibility Student",
        )
        self.canteen = Canteen.objects.create(
            name="Visibility Canteen",
            location="Hall 5",
        )
        self.cash_order = CanteenOrder.objects.create(
            order_number="VIS-CASH-001",
            student=self.student,
            canteen=self.canteen,
            subtotal=Decimal("50.00"),
            delivery_fee=Decimal("0.00"),
            total_amount=Decimal("50.00"),
            status=CanteenOrder.STATUS_PENDING,
        )
        self.online_order = CanteenOrder.objects.create(
            order_number="VIS-ONLINE-001",
            student=self.student,
            canteen=self.canteen,
            subtotal=Decimal("75.00"),
            delivery_fee=Decimal("0.00"),
            total_amount=Decimal("75.00"),
            status=CanteenOrder.STATUS_PENDING,
        )
        Payment.objects.create(
            order=self.online_order,
            amount=self.online_order.total_amount,
            status=Payment.STATUS_PENDING,
            payment_method="razorpay",
        )
        self.client.force_authenticate(user=self.user)

    def test_student_order_list_hides_unpaid_online_orders(self):
        response = self.client.get("/api/orders/")

        self.assertEqual(response.status_code, 200)
        returned_order_numbers = {item["order_number"] for item in response.data}
        self.assertIn(self.cash_order.order_number, returned_order_numbers)
        self.assertNotIn(self.online_order.order_number, returned_order_numbers)


class CanteenManagerPickupVerificationApiTests(APITestCase):
    def setUp(self):
        self.manager_role = Role.objects.create(role_name="canteen_manager")
        self.student_role = Role.objects.create(role_name="student")
        self.canteen = Canteen.objects.create(
            name="Issue 33 Canteen",
            location="Hall 33",
        )
        self.manager = User.objects.create_user(
            email="issue33.manager@example.com",
            password="password123",
            role=self.manager_role,
            is_active=True,
            is_verified=True,
        )
        Staff.objects.create(
            user=self.manager,
            full_name="Issue 33 Manager",
            employee_code="ISSUE33MGR",
            canteen=self.canteen,
        )

        self.student_user = User.objects.create_user(
            email="issue33.student@iitk.ac.in",
            password="password123",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        self.student = Student.objects.create(
            user=self.student_user,
            roll_number="ISSUE33",
            full_name="Issue 33 Student",
        )
        self.item = CanteenMenuItem.objects.create(
            canteen=self.canteen,
            item_name="Issue 33 Item",
            price=Decimal("40.00"),
            preparation_time_mins=10,
            available_quantity=10,
            is_veg=True,
            is_available=True,
        )
        self.order = CanteenOrder.objects.create(
            order_number="ISSUE33-VERIFY",
            student=self.student,
            canteen=self.canteen,
            order_type=CanteenOrder.ORDER_TYPE_PICKUP,
            subtotal=Decimal("40.00"),
            delivery_fee=Decimal("0.00"),
            total_amount=Decimal("40.00"),
            status=CanteenOrder.STATUS_READY,
            estimated_ready_time=timezone.now(),
            pickup_otp="123456",
        )
        CanteenOrderItem.objects.create(
            order=self.order,
            menu_item=self.item,
            quantity=1,
            unit_price=Decimal("40.00"),
            total_price=Decimal("40.00"),
        )
        self.client.force_authenticate(user=self.manager)

    def test_invalid_pickup_otp_returns_field_error(self):
        response = self.client.post(
            f"/api/canteen-manager/orders/{self.order.id}/verify-pickup/",
            {"pickup_otp": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["pickup_otp"], "Invalid pickup OTP.")
