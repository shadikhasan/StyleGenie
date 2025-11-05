from django.contrib.auth import get_user_model
from rest_framework import serializers
from client.models import WardrobeItem

User = get_user_model()

class WardrobeItemSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = WardrobeItem
        fields = ["id", "user", "user_email", "image_url", "title", "color", "category", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "user_email", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
