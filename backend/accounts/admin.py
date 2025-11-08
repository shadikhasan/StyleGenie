from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin panel for the User model."""

    list_display = (
        "id",
        "username",
        "email",
        "role",
        "first_name",
        "last_name",
        "status",
        "is_staff",
        "is_superuser",
        "created_at",
    )

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email")}),
        (
            _("Permissions"),
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        (
            _("Important dates"),
            {"fields": ("last_login", "created_at")},  # ✅ use your field instead of date_joined
        ),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("username", "email", "password1", "password2"),
        }),
    )

    readonly_fields = ("created_at", "last_login_at")  # ✅ make sure both exist in your model

    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)
