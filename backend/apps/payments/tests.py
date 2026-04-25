from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APITestCase

from apps.canteen.models import Canteen, CanteenMenuItem
from apps.orders.models import CanteenOrder
from apps.orders.services import create_order_for_student
from apps.users.models import Role, Student, User

from .models import Payment


class PaymentModelSmokeTests(TestCase):
    def test_create_payment_record(self):
        role = Role.objects.create(role_name="student")
        user = User.objects.create_user(email="student-pay@iitk.ac.in", password="password123", role=role)
        student = Student.objects.create(
            user=user,
            roll_number="23002",
            full_name="Payment Student",
        )
        canteen = Canteen.objects.create(
            name="Hall 4 Canteen",
            location="Hall 4",
            opening_time="08:00",
            closing_time="22:00",
        )
        order = CanteenOrder.objects.create(
            order_number="UD-20260322-0001",
            student=student,
            canteen=canteen,
            subtotal="100.00",
            delivery_fee="0.00",
            total_amount="100.00",
        )
        payment = Payment.objects.create(order=order, amount=order.total_amount)
        self.assertEqual(payment.status, Payment.STATUS_PENDING)


class PaymentVerificationFailureTests(APITestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name="student")
        self.user = User.objects.create_user(
            email="verify-failure@iitk.ac.in",
            password="password123",
            role=self.role,
            is_active=True,
            is_verified=True,
        )
        self.student = Student.objects.create(
            user=self.user,
            roll_number="PAY001",
            full_name="Payment Failure Student",
        )
        self.canteen = Canteen.objects.create(
            name="Payment Failure Canteen",
            location="Hall 9",
            opening_time="08:00",
            closing_time="22:00",
        )
        self.item = CanteenMenuItem.objects.create(
            canteen=self.canteen,
            item_name="Masala Dosa",
            price=Decimal("63.00"),
            preparation_time_mins=8,
            available_quantity=6,
        )
        self.order = create_order_for_student(
            self.student,
            {
                "canteen_id": self.canteen.id,
                "order_type": "pickup",
                "items": [{"menu_item_id": self.item.id, "quantity": 2}],
            },
        )
        self.payment = Payment.objects.create(
            order=self.order,
            amount=self.order.total_amount,
            status=Payment.STATUS_PENDING,
            payment_method="razorpay",
            razorpay_order_id="order_test_failure",
        )
        self.client.force_authenticate(user=self.user)

    @patch("apps.payments.views.verify_payment_signature", return_value=False)
    def test_invalid_signature_cancels_order_and_restores_inventory(self, _mock_verify):
        self.item.refresh_from_db()
        self.assertEqual(self.item.available_quantity, 4)

        response = self.client.post(
            "/api/payments/verify/",
            {
                "razorpay_order_id": "order_test_failure",
                "razorpay_payment_id": "pay_test_failure",
                "razorpay_signature": "invalid-signature",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

        self.order.refresh_from_db()
        self.payment.refresh_from_db()
        self.item.refresh_from_db()

        self.assertEqual(self.order.status, CanteenOrder.STATUS_CANCELLED)
        self.assertEqual(self.payment.status, Payment.STATUS_FAILED)
        self.assertEqual(self.item.available_quantity, 6)
