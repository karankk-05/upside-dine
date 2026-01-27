from rest_framework import serializers


class AddNumbersSerializer(serializers.Serializer):
    """Serializer for adding two numbers."""
    a = serializers.FloatField(
        required=True,
        help_text="First number to add",
        example=5
    )
    b = serializers.FloatField(
        required=True,
        help_text="Second number to add", 
        example=10
    )
