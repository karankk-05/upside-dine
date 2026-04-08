from django.test import TestCase

from .models import Canteen, CanteenPaymentConfig
from .serializers import CanteenPaymentConfigSerializer


class CanteenPaymentConfigSerializerTests(TestCase):
    def setUp(self):
        self.canteen = Canteen.objects.create(
            name="Hall 3 Canteen",
            location="Hall 3",
        )
        self.config = CanteenPaymentConfig.objects.create(canteen=self.canteen)

    def test_accepts_valid_upi_id(self):
        serializer = CanteenPaymentConfigSerializer(
            self.config,
            data={"upi_id": "canteen.payments@oksbi"},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["upi_id"], "canteen.payments@oksbi")

    def test_rejects_invalid_upi_id(self):
        serializer = CanteenPaymentConfigSerializer(
            self.config,
            data={"upi_id": "not a valid upi"},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["upi_id"][0], "Enter a valid UPI ID like yourname@bank.")

    def test_trims_upi_id_before_saving(self):
        serializer = CanteenPaymentConfigSerializer(
            self.config,
            data={"upi_id": "  canteen@upi  "},
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["upi_id"], "canteen@upi")
