# apps/accounts/admin.py
from django.contrib import admin
from .models import ClientProfile, WardrobeItem

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "gender", "skin_tone", "body_shape", "face_shape", "created_at")


@admin.register(WardrobeItem)
class WardrobeItemAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "category", "color", "created_at")