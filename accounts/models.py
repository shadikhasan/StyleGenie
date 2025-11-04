# apps/accounts/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .managers import UserManager  # implements create_user/create_superuser

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        STYLIST = "stylist", "Stylist"
        ADMIN = "admin", "Admin"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        BANNED = "banned", "Banned"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=254, unique=True)
    phone = models.CharField(max_length=32, unique=True, null=True, blank=True)

    first_name = models.CharField(max_length=150, null=True, blank=True)
    last_name = models.CharField(max_length=150, null=True, blank=True)
    
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.CLIENT)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    profile_picture = models.URLField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"           # email+password login
    REQUIRED_FIELDS = ["username"]     # prompted for createsuperuser

    objects = UserManager()

    def __str__(self):
        return f"{self.username} <{self.email}>"

    def save(self, *args, **kwargs):
        # keep last_login_at in sync if needed by custom auth pipeline
        super().save(*args, **kwargs)
