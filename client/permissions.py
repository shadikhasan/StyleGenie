from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth import get_user_model
User = get_user_model()

class IsClientOwner(BasePermission):
    """
    Allow access only to the item's owner. Optionally enforce role=client.
    """

    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        # If you want to restrict to clients only, uncomment this:
        # try:
        #     return u.role == User.Role.CLIENT
        # except AttributeError:
        #     return getattr(u, "role", None) == "client"
        return True

    def has_object_permission(self, request, view, obj):
        return obj.user_id == request.user.id
