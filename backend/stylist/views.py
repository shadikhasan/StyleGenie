# apps/stylist/views.py
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import permissions, status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from common.utils import revoke_user_tokens
from stylist.models import StylistProfile  # adjust path
from common.permissions import IsStylist
from stylist.serializers import (
    StylistRegisterSerializer,
    StylistLoginSerializer,
    StylistProfileSerializer,
    StylistChangePasswordSerializer,
    StylistSendPasswordResetEmailSerializer,
    StylistPasswordResetSerializer,
)

User = get_user_model()


# --- Auth ---
class StylistRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = StylistRegisterSerializer


class StylistLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = StylistLoginSerializer


class StylistLogoutView(APIView):
    permission_classes = [IsAuthenticated, IsStylist]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            return Response(status=status.HTTP_205_RESET_CONTENT)
        return Response(status=status.HTTP_205_RESET_CONTENT)


# --- Me / Profile ---
class StylistProfileView(APIView):
    permission_classes = [IsAuthenticated, IsStylist]

    def get(self, request):
        profile, _ = StylistProfile.objects.get_or_create(user=request.user)
        return Response(StylistProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = StylistProfile.objects.get_or_create(user=request.user)
        s = StylistProfileSerializer(profile, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=status.HTTP_200_OK)


# --- Password Change ---
class StylistChangePasswordView(APIView):
    permission_classes = [IsAuthenticated, IsStylist]

    def post(self, request):
        s = StylistChangePasswordSerializer(data=request.data, context={"user": request.user})
        s.is_valid(raise_exception=True)
        s.save()
        revoke_user_tokens(request.user)
        return Response({"msg": "Password changed successfully."}, status=200)


# --- Password Reset (email link flow) ---
class StylistSendPasswordResetEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = StylistSendPasswordResetEmailSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        resp = {"msg": "If the email exists, a reset link has been sent."}
        if getattr(s, "reset_link", None):
            from django.conf import settings
            if getattr(settings, "DEBUG", False):
                resp["dev_link"] = s.reset_link
        return Response(resp, status=200)


class StylistPasswordResetConfirmView(APIView):
    """
    POST /stylist/auth/reset-password/<uidb64>/<token>/
    body: {"new_password": "..."}
    """
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        s = StylistPasswordResetSerializer(data=request.data, context={"uidb64": uidb64, "token": token})
        s.is_valid(raise_exception=True)
        user = s.save()
        revoke_user_tokens(user)
        return Response({"msg": "Password reset successful."}, status=200)
