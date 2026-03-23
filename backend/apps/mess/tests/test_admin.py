from django.contrib import admin
from django.test import TestCase

from apps.mess.admin import MessAdmin, MessBookingAdmin, MessMenuItemAdmin, MessStaffAssignmentAdmin
from apps.mess.models import Mess, MessBooking, MessMenuItem, MessStaffAssignment


class MessAdminRegistrationTests(TestCase):
    def test_all_mess_models_registered_in_admin_site(self):
        self.assertIn(Mess, admin.site._registry)
        self.assertIn(MessMenuItem, admin.site._registry)
        self.assertIn(MessBooking, admin.site._registry)
        self.assertIn(MessStaffAssignment, admin.site._registry)

    def test_registered_admin_classes_are_expected(self):
        self.assertIsInstance(admin.site._registry[Mess], MessAdmin)
        self.assertIsInstance(admin.site._registry[MessMenuItem], MessMenuItemAdmin)
        self.assertIsInstance(admin.site._registry[MessBooking], MessBookingAdmin)
        self.assertIsInstance(admin.site._registry[MessStaffAssignment], MessStaffAssignmentAdmin)

    def test_booking_admin_readonly_fields_cover_sensitive_qr_fields(self):
        model_admin = admin.site._registry[MessBooking]
        readonly_fields = set(model_admin.readonly_fields)
        self.assertIn("qr_code", readonly_fields)
        self.assertIn("qr_generated_at", readonly_fields)
        self.assertIn("qr_expires_at", readonly_fields)
        self.assertIn("redeemed_at", readonly_fields)

    def test_booking_admin_filters_include_status_date_meal_and_mess(self):
        model_admin = admin.site._registry[MessBooking]
        list_filters = set(model_admin.list_filter)
        self.assertIn("status", list_filters)
        self.assertIn("booking_date", list_filters)
        self.assertIn("meal_type", list_filters)
        self.assertIn("menu_item__mess", list_filters)

