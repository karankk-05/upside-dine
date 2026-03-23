from django.contrib import admin

from .models import Mess, MessBooking, MessMenuItem, MessStaffAssignment

@admin.register(Mess)
class MessAdmin(admin.ModelAdmin):
    list_display = ("name", "hall_name", "location", "is_active", "created_at", "updated_at")
    list_filter = ("is_active", "hall_name")
    search_fields = ("name", "hall_name", "location")
    ordering = ("name",)


@admin.register(MessMenuItem)
class MessMenuItemAdmin(admin.ModelAdmin):
    list_display = (
        "item_name",
        "mess",
        "meal_type",
        "day_of_week",
        "price",
        "available_quantity",
        "default_quantity",
        "is_active",
        "updated_at",
    )
    list_filter = ("mess", "meal_type", "day_of_week", "is_active")
    search_fields = ("item_name", "description", "mess__name", "mess__hall_name")
    autocomplete_fields = ("mess",)
    ordering = ("mess__name", "day_of_week", "meal_type", "item_name")


@admin.register(MessBooking)
class MessBookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "menu_item",
        "quantity",
        "total_price",
        "status",
        "booking_date",
        "qr_expires_at",
        "redeemed_at",
        "redeemed_by_staff",
    )
    list_filter = ("status", "booking_date", "meal_type", "menu_item__mess")
    search_fields = (
        "qr_code",
        "student__full_name",
        "student__roll_number",
        "menu_item__item_name",
        "menu_item__mess__name",
        "redeemed_by_staff__full_name",
    )
    autocomplete_fields = ("student", "menu_item", "redeemed_by_staff")
    readonly_fields = (
        "qr_code",
        "qr_generated_at",
        "qr_expires_at",
        "redeemed_at",
        "created_at",
        "updated_at",
    )
    date_hierarchy = "booking_date"
    ordering = ("-created_at",)


@admin.register(MessStaffAssignment)
class MessStaffAssignmentAdmin(admin.ModelAdmin):
    list_display = ("staff", "mess", "assignment_role", "is_active", "created_at", "updated_at")
    list_filter = ("mess", "assignment_role", "is_active")
    search_fields = ("staff__full_name", "staff__employee_code", "mess__name", "mess__hall_name")
    autocomplete_fields = ("staff", "mess")
    ordering = ("mess__name", "assignment_role", "staff__full_name")
