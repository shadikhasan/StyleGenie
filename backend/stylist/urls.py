# apps/stylist/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from stylist.views import (
    StylistRegisterView,
    StylistLoginView,
    StylistLogoutView,
    StylistProfileView,
    StylistChangePasswordView,
    StylistSendPasswordResetEmailView,
    StylistPasswordResetConfirmView,
)

urlpatterns = [
    # Auth
    path("auth/register/", StylistRegisterView.as_view(), name="stylist-register"),
    path("auth/login/", StylistLoginView.as_view(), name="stylist-login"),
    path("auth/logout/", StylistLogoutView.as_view(), name="stylist-logout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="stylist-token-refresh"),

    # Profile / Self
    path("me/", StylistProfileView.as_view(), name="stylist-profile"),

    # Password management
    path("auth/change-password/", StylistChangePasswordView.as_view(), name="stylist-change-password"),
    path("auth/send-reset-password-email/", StylistSendPasswordResetEmailView.as_view(), name="stylist-send-reset-password-email"),
    path("auth/reset-password/<uidb64>/<token>/", StylistPasswordResetConfirmView.as_view(), name="stylist-reset-password-confirm"),
]
