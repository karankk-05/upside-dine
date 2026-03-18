from rest_framework.test import APITestCase


class AuthSmokeTests(APITestCase):
    def test_register_requires_iitk_email(self):
        response = self.client.post("/api/auth/register/", {"email": "user@gmail.com", "password": "password123"})
        self.assertEqual(response.status_code, 400)