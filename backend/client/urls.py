"""
client/urls.py

Client-facing routes: authentication, password management, and profile.
"""

from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from client.views.stylist import StylistBrowseViewSet
from client.views.wardrobe import WardrobeItemViewSet

from client.views.auth import (
    ClientRegisterView,
    ClientLoginView,
    ClientLogoutView,
    ClientProfileView,
    ChangePasswordView,
    SendPasswordResetEmailView,
    PasswordResetConfirmView,
)

app_name = "client"

router = DefaultRouter()
router.register(r"wardrobe", WardrobeItemViewSet, basename="wardrobe")
router.register(r"stylists", StylistBrowseViewSet, basename="client-stylists")

urlpatterns = [
    # --- Auth ---
    path("auth/register/", ClientRegisterView.as_view(), name="client-register"),
    
    path("auth/login/", ClientLoginView.as_view(), name="client-login"),
    path("auth/logout/", ClientLogoutView.as_view(), name="client-logout"),
    
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="client-token-refresh"),

    # --- Profile / Self ---
    path("me/", ClientProfileView.as_view(), name="client-profile"),

    # --- Password Management ---
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/send-reset-password-email/", SendPasswordResetEmailView.as_view(), name="send-reset-password-email"),
    path("auth/reset-password/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="reset-password-confirm",),
    
    path("", include(router.urls)),
]
