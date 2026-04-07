from django.contrib import admin

from .models import Canteen, CanteenMenuCategory, CanteenMenuItem


@admin.register(Canteen)
class CanteenAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "location",
        "is_delivery_available",
        "min_order_amount",
        "delivery_fee",
        "is_active",
        "rating",
    )
    list_filter = ("is_active", "is_delivery_available")
    search_fields = ("name", "location")


@admin.register(CanteenMenuCategory)
class CanteenMenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("category_name", "canteen", "display_order", "is_active")
    list_filter = ("is_active", "canteen")
    search_fields = ("category_name", "canteen__name")
    ordering = ("canteen", "display_order")


@admin.register(CanteenMenuItem)
class CanteenMenuItemAdmin(admin.ModelAdmin):
    list_display = (
        "item_name",
        "canteen",
        "category",
        "price",
        "is_veg",
        "is_available",
        "available_quantity",
        "is_active",
    )
    list_filter = ("canteen", "category", "is_veg", "is_available", "is_active")
    search_fields = ("item_name", "canteen__name", "category__category_name")
