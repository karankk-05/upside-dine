import django_filters

from .models import Canteen, CanteenMenuItem


class CanteenFilter(django_filters.FilterSet):
    is_delivery_available = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Canteen
        fields = ["is_delivery_available", "is_active"]


class CanteenMenuItemFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category_id")
    canteen = django_filters.NumberFilter(field_name="canteen_id")
    is_veg = django_filters.BooleanFilter()
    is_available = django_filters.BooleanFilter()
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = CanteenMenuItem
        fields = ["category", "canteen", "is_veg", "is_available", "min_price", "max_price"]
