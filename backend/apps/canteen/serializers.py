from decimal import Decimal

from rest_framework import serializers

from .models import Canteen, CanteenMenuCategory, CanteenMenuItem


class CanteenMenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CanteenMenuCategory
        fields = ["id", "canteen", "category_name", "display_order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CanteenMenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.category_name", read_only=True)

    class Meta:
        model = CanteenMenuItem
        fields = [
            "id",
            "canteen",
            "category",
            "category_name",
            "item_name",
            "description",
            "price",
            "preparation_time_mins",
            "is_veg",
            "is_available",
            "available_quantity",
            "image_url",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CanteenListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Canteen
        fields = [
            "id",
            "name",
            "location",
            "contact_phone",
            "opening_time",
            "closing_time",
            "is_delivery_available",
            "min_order_amount",
            "delivery_fee",
            "is_active",
            "rating",
        ]


class CanteenDetailSerializer(CanteenListSerializer):
    categories = CanteenMenuCategorySerializer(many=True, read_only=True)

    class Meta(CanteenListSerializer.Meta):
        fields = CanteenListSerializer.Meta.fields + ["categories"]


class CategoryWithItemsSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = CanteenMenuCategory
        fields = ["id", "category_name", "display_order", "items"]

    def get_items(self, obj):
        active_items = obj.menu_items.filter(is_active=True, is_available=True).order_by("item_name")
        return CanteenMenuItemSerializer(active_items, many=True).data


class CanteenSearchResultSerializer(serializers.ModelSerializer):
    canteen_id = serializers.IntegerField(source="canteen.id", read_only=True)
    canteen_name = serializers.CharField(source="canteen.name", read_only=True)
    category_name = serializers.CharField(source="category.category_name", read_only=True)

    class Meta:
        model = CanteenMenuItem
        fields = [
            "id",
            "item_name",
            "description",
            "price",
            "is_veg",
            "is_available",
            "available_quantity",
            "canteen_id",
            "canteen_name",
            "category_name",
            "image_url",
        ]


class CanteenManagerStatsSerializer(serializers.Serializer):
    canteen_id = serializers.IntegerField()
    canteen_name = serializers.CharField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    pending_orders = serializers.IntegerField()
    preparing_orders = serializers.IntegerField()
    ready_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
