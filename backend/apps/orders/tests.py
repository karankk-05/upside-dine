from django.test import TestCase

from apps.canteen.models import Canteen, CanteenMenuItem
from apps.users.models import Role, Student, User

from .services import create_order_for_student


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
