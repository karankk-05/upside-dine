from django.contrib import admin

from .models import CanteenOrder, CanteenOrderItem


class CanteenOrderItemInline(admin.TabularInline):
    model = CanteenOrderItem
    extra = 0
    readonly_fields = ("menu_item", "quantity", "unit_price", "total_price", "special_instructions", "created_at")


@admin.register(CanteenOrder)
class CanteenOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "student",
        "canteen",
        "order_type",
        "status",
        "total_amount",
        "created_at",
    )
    list_filter = ("status", "order_type", "canteen")
    search_fields = ("order_number", "student__full_name", "student__user__email", "canteen__name")
    inlines = [CanteenOrderItemInline]


@admin.register(CanteenOrderItem)
class CanteenOrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "menu_item", "quantity", "unit_price", "total_price")
    search_fields = ("order__order_number", "menu_item__item_name")
