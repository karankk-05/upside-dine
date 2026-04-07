from rest_framework import serializers


class AddNumbersSerializer(serializers.Serializer):
    """Serializer for adding two numbers."""
    a = serializers.FloatField(
        required=True,
        help_text="First number to add"
    )
    b = serializers.FloatField(
        required=True,
        help_text="Second number to add"
    )
