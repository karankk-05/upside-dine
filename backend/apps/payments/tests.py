from django.test import TestCase

from apps.canteen.models import Canteen
from apps.orders.models import CanteenOrder
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
