from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Canteen, CanteenPaymentConfig
from apps.users.models import Role, Staff, User
from .models import CanteenMenuCategory, CanteenMenuItem


class CanteenModelSmokeTests(TestCase):
    def test_can_create_canteen(self):
        canteen = Canteen.objects.create(
            name="Hall 2 Canteen",
            location="Hall 2",
        )
        self.assertEqual(canteen.name, "Hall 2 Canteen")


class CanteenManagerMenuApiTests(APITestCase):
    def setUp(self):
        self.canteen = Canteen.objects.create(name="Issue 21 Canteen", location="Hall 21")
        self.manager_role = Role.objects.create(role_name="canteen_manager")
        self.manager = User.objects.create_user(
            email="issue21.manager@iitk.ac.in",
            password="password123",
            role=self.manager_role,
            is_active=True,
            is_verified=True,
        )
        Staff.objects.create(
            user=self.manager,
            full_name="Issue 21 Manager",
            employee_code="ISSUE21MGR",
            canteen=self.canteen,
        )
        self.client.force_authenticate(user=self.manager)

    def test_manager_can_add_menu_item_using_named_category(self):
        response = self.client.post(
            "/api/canteen-manager/menu/",
            {
                "item_name": "Cheese Toast",
                "description": "Toast with cheese",
                "price": "55.00",
                "category": "snacks",
                "is_veg": True,
                "preparation_time_mins": 10,
                "is_available": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["category_name"], "Snacks")

        menu_item = CanteenMenuItem.objects.get(item_name="Cheese Toast")
        self.assertEqual(menu_item.canteen_id, self.canteen.id)
        self.assertEqual(menu_item.category.category_name, "Snacks")

    def test_manager_can_update_menu_item_using_named_category(self):
        original_category = CanteenMenuCategory.objects.create(
            canteen=self.canteen,
            category_name="Snacks",
            display_order=1,
        )
        menu_item = CanteenMenuItem.objects.create(
            canteen=self.canteen,
            category=original_category,
            item_name="Cold Coffee",
            description="Iced coffee",
            price=Decimal("65.00"),
            preparation_time_mins=8,
            is_veg=True,
            is_available=True,
        )

        response = self.client.patch(
            f"/api/canteen-manager/menu/{menu_item.id}/",
            {"category": "beverages"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        menu_item.refresh_from_db()
        self.assertEqual(menu_item.category.category_name, "Beverages")
        self.assertEqual(response.data["category_name"], "Beverages")


class CanteenDetailPaymentConfigApiTests(APITestCase):
    def setUp(self):
        self.student_role = Role.objects.create(role_name="student")
        self.student_user = User.objects.create_user(
            email="issue51.student@iitk.ac.in",
            password="password123",
            role=self.student_role,
            is_active=True,
            is_verified=True,
        )
        self.canteen = Canteen.objects.create(name="Issue 51 Canteen", location="Hall 5")
        self.client.force_authenticate(user=self.student_user)

    def test_detail_returns_default_payment_config_when_none_saved(self):
        response = self.client.get(f"/api/canteens/{self.canteen.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["payment_config"],
            {
                "payment_mode": CanteenPaymentConfig.PAYMENT_MODE_BOTH,
                "upi_id": "",
                "qr_image_url": "",
            },
        )

    def test_detail_returns_saved_payment_config(self):
        CanteenPaymentConfig.objects.create(
            canteen=self.canteen,
            payment_mode=CanteenPaymentConfig.PAYMENT_MODE_CASH,
            upi_id="issue51@upi",
            qr_image_url="https://example.com/issue51-qr.png",
        )

        response = self.client.get(f"/api/canteens/{self.canteen.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["payment_config"],
            {
                "payment_mode": CanteenPaymentConfig.PAYMENT_MODE_CASH,
                "upi_id": "issue51@upi",
                "qr_image_url": "https://example.com/issue51-qr.png",
            },
        )
