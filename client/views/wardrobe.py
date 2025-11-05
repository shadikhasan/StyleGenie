from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from client.models import WardrobeItem
from client.serializers.wardrobe import WardrobeItemSerializer
from client.permissions import IsClientOwner

class WardrobeItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for the authenticated user's wardrobe items.
    """
    serializer_class = WardrobeItemSerializer
    permission_classes = [IsAuthenticated, IsClientOwner]

    def get_queryset(self):
        # Only the current user's items
        return WardrobeItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
