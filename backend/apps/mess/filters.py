import django_filters

from .models import MessBooking, MessMenuItem


class MessMenuItemFilter(django_filters.FilterSet):
    meal_type = django_filters.ChoiceFilter(choices=MessMenuItem.MealType.choices)
    day_of_week = django_filters.ChoiceFilter(choices=MessMenuItem.DayOfWeek.choices)
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = MessMenuItem
        fields = ["meal_type", "day_of_week", "is_active"]


class MessManagerBookingFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=MessBooking.Status.choices)
    meal_type = django_filters.ChoiceFilter(choices=MessMenuItem.MealType.choices)
    booking_date = django_filters.DateFilter(field_name="booking_date")
    booking_date_from = django_filters.DateFilter(field_name="booking_date", lookup_expr="gte")
    booking_date_to = django_filters.DateFilter(field_name="booking_date", lookup_expr="lte")

    class Meta:
        model = MessBooking
        fields = ["status", "meal_type", "booking_date", "booking_date_from", "booking_date_to"]
