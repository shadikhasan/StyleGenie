# apps/common/permissions.py
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()

class IsRole(BasePermission):
    required_role = None  # override in subclasses
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and self.required_role is not None
            and request.user.role == self.required_role
        )

class IsClient(IsRole):  required_role = User.Role.CLIENT
class IsStylist(IsRole): required_role = User.Role.STYLIST
class IsAdmin(IsRole):   required_role = User.Role.ADMIN
