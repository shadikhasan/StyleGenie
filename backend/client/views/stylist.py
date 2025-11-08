# apps/client/views/stylists.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from stylist.models import StylistProfile
from client.serializers.stylist import StylistPublicSerializer
from common.permissions import IsClient

class StylistBrowseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Allow authenticated clients to list & view stylists.
    """
    serializer_class = StylistPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only stylists whose User is active & has role='stylist'
        return (
            StylistProfile.objects
            .select_related("user")
            .filter(user__is_active=True, user__role="stylist")
            .order_by("-rating", "-rating_count", "-updated_at")
        )
