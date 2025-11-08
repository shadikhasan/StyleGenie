# apps/client/serializers/stylist_public.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from stylist.models import StylistProfile  # adjust import if needed

User = get_user_model()

class StylistUserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "profile_picture"]  # expose only what you want

class StylistPublicSerializer(serializers.ModelSerializer):
    user = StylistUserPublicSerializer(read_only=True)

    class Meta:
        model = StylistProfile
        fields = [
            "user",
            "bio",
            "expertise",
            "years_experience",
            "rating",
            "rating_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
