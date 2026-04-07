from django.test import TestCase

from .models import Canteen


class CanteenModelSmokeTests(TestCase):
    def test_can_create_canteen(self):
        canteen = Canteen.objects.create(
            name="Hall 2 Canteen",
            location="Hall 2",
            opening_time="08:00",
            closing_time="22:00",
        )
        self.assertEqual(canteen.name, "Hall 2 Canteen")
