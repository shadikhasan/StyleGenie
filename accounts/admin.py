from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin panel view for the User model."""

    # Fields shown in the list view
    list_display = (
        "id",
        "username",
        "email",
        "role",
        "status",
        "is_staff",
        "is_superuser",
        "created_at",
    )
    list_filter = ("role", "status", "is_staff", "is_superuser", "created_at")

    # Searchable fields
    search_fields = ("email", "username", "phone")

    # Order by creation date (latest first)
    ordering = ("-created_at",)

    # Use fieldsets to organize fields in the form
    fieldsets = (
        (_("Login Info"), {"fields": ("email", "password")}),
        (_("Personal Info"), {"fields": ("username", "phone", "profile_picture")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "role",
                    "status",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Timestamps"), {"fields": ("last_login", "created_at", "updated_at")}),
    )

    # Fields shown when adding a new user in admin
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "username", "password1", "password2", "role", "status"),
            },
        ),
    )

    # Mark readonly fields to avoid manual editing of timestamps
    readonly_fields = ("created_at", "updated_at")

    # Enable filter sidebar for large datasets
    list_per_page = 25
