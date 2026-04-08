from rest_framework.test import APITestCase

from apps.crowd.models import CameraFeed
from apps.mess.models import Mess
from apps.users.models import Role, User


class CameraFeedApiTests(APITestCase):
    def setUp(self):
        self.mess_manager_role = Role.objects.create(role_name="mess_manager")
        self.manager = User.objects.create_user(
            email="crowd.manager@example.com",
            password="password123",
            role=self.mess_manager_role,
            is_active=True,
            is_verified=True,
        )
        self.client.force_authenticate(user=self.manager)

        self.hall_one = Mess.objects.create(hall_name="Hall 1", location="North")
        self.hall_two = Mess.objects.create(hall_name="Hall 2", location="South")

    def test_feed_list_numbers_feeds_sequentially_per_mess(self):
        first_feed = CameraFeed.objects.create(
            mess_id=self.hall_one.id,
            camera_url="https://example.com/feed-1",
            location_description="North Gate",
        )
        second_feed = CameraFeed.objects.create(
            mess_id=self.hall_one.id,
            camera_url="https://example.com/feed-2",
            location_description="Dining Hall",
        )
        other_mess_feed = CameraFeed.objects.create(
            mess_id=self.hall_two.id,
            camera_url="https://example.com/feed-3",
            location_description="Lobby",
        )

        response = self.client.get("/api/crowd/feeds/")

        self.assertEqual(response.status_code, 200)

        numbers_by_feed_id = {
            item["id"]: item["feed_number"]
            for item in response.data
        }

        self.assertEqual(numbers_by_feed_id[first_feed.id], 1)
        self.assertEqual(numbers_by_feed_id[second_feed.id], 2)
        self.assertEqual(numbers_by_feed_id[other_mess_feed.id], 1)

    def test_new_feed_uses_first_display_number_after_previous_feed_is_deleted(self):
        original_feed = CameraFeed.objects.create(
            mess_id=self.hall_one.id,
            camera_url="https://example.com/original-feed",
            location_description="Main Entry",
        )
        original_feed.delete()

        replacement_feed = CameraFeed.objects.create(
            mess_id=self.hall_one.id,
            camera_url="https://example.com/replacement-feed",
            location_description="Main Entry",
        )

        response = self.client.get("/api/crowd/feeds/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], replacement_feed.id)
        self.assertEqual(response.data[0]["feed_number"], 1)
