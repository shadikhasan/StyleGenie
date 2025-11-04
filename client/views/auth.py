# apps/client/views.py
import uuid
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_str, smart_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.translation import gettext_lazy as _
from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from client.serializers.auth import (
    ClientChangePasswordSerializer,
    ClientPasswordResetSerializer,
    ClientRegisterSerializer,
    ClientLoginSerializer,
    ClientProfileSerializer,
    ClientSendPasswordResetEmailSerializer,

)
from common.utils import revoke_user_tokens

User = get_user_model()

# Optional ClientProfile import
try:
    from ..models import ClientProfile
except Exception:
    ClientProfile = None


# --- Auth ---

class ClientRegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ClientRegisterSerializer


class ClientLoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ClientLoginSerializer


class ClientLogoutView(APIView):
    """
    Expect body: {"refresh": "<refresh_token>"}
    Uses SimpleJWT blacklist app.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except Exception:
            # If token invalid/expired, still return 205 (logout best-effort)
            return Response(status=status.HTTP_205_RESET_CONTENT)
        return Response(status=status.HTTP_205_RESET_CONTENT)


# --- Me / Profile ---

class ClientProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Return client profile if exists, otherwise user basics
        if ClientProfile:
            profile, _ = ClientProfile.objects.get_or_create(user=request.user)
            data = ClientProfileSerializer(profile).data
        else:
            data = ClientProfileSerializer(request.user).data
        return Response(data)

    def patch(self, request):
        if not ClientProfile:
            return Response({"detail": "ClientProfile model not available."}, status=501)

        profile, _ = ClientProfile.objects.get_or_create(user=request.user)
        serializer = ClientProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# --------------------------
# P A S S W O R D   C H A N G E
# --------------------------
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ClientChangePasswordSerializer(data=request.data, context={"user": request.user})
        s.is_valid(raise_exception=True)
        s.save()

        # Optional but recommended: revoke all existing refresh tokens for this user
        revoke_user_tokens(request.user)

        return Response({"msg": "Password changed successfully."}, status=200)


# --------------------------
# P A S S W O R D   R E S E T  (email link flow)
# --------------------------
class SendPasswordResetEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = ClientSendPasswordResetEmailSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()

        # s.reset_link is set only for dev convenience by the serializer
        resp = {"msg": "If the email exists, a reset link has been sent."}
        if getattr(s, "reset_link", None) and getattr(settings, "DEBUG", False):
            resp["dev_link"] = s.reset_link
        return Response(resp, status=200)


# --------------------------
# N E W   P A S S W O R D   S E T  (with uid and token)
# --------------------------
class PasswordResetConfirmView(APIView):
    """
    POST /client/auth/reset-password/<uidb64>/<token>/
    body: {"new_password": "..."}
    """
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        s = ClientPasswordResetSerializer(
            data=request.data,
            context={"uidb64": uidb64, "token": token},
        )
        s.is_valid(raise_exception=True)
        user = s.save()  # returns the user after setting new password

        # important: request.user is anonymous here; revoke by reset user:
        revoke_user_tokens(user)

        return Response({"msg": "Password reset successful."}, status=200)