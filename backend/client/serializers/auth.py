# client/serializers.py

import os

# Django imports
from django.conf import settings
from django.contrib.auth import (
    authenticate,
    get_user_model,
    password_validation,
)
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, smart_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.translation import gettext_lazy as _

# Third-party imports
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Local imports
from common.utils import get_tokens_for_user, send_password_reset_email
from client.models import ClientProfile

User = get_user_model()


class ClientRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ["email", "username", "first_name", "last_name", "password", "phone", "profile_picture"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.setdefault("role", "client")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class ClientLoginSerializer(serializers.Serializer):
    """
    Login serializer using email and password.
    Returns JWT tokens and basic user info.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError(_("Both email and password are required."))

        user = authenticate(request=self.context.get("request"), email=email, password=password)

        if not user:
            raise serializers.ValidationError(_("Invalid email or password."))

        if not user.is_active:
            raise serializers.ValidationError(_("This account is inactive."))

        # Generate tokens using your custom helper
        tokens = get_tokens_for_user(user)

        # Return tokens + user info
        return {
            "tokens": tokens,
            "user": {
                "id": str(user.pk),
                "email": user.email,
                "username": user.username,
                "role": getattr(user, "role", None),
                "status": getattr(user, "status", None),
            },
        }

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username","first_name", "last_name", "phone", "profile_picture", "role", "status"]
        read_only_fields = fields

class ClientProfileReadSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = ClientProfile
        fields = [
            "user",
            "date_of_birth",
            "gender",
            "skin_tone",
            "body_shape",
            "face_shape",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)
    profile_picture = serializers.URLField(source="user.profile_picture_url", required=False, allow_blank=True)
    class Meta:
        model = ClientProfile
        fields = [
            "first_name",
            'last_name',
            "profile_picture",
            "date_of_birth",
            "gender",
            "skin_tone",
            "body_shape",
            "face_shape",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
        
    @staticmethod
    def _blank_to_none(v):
        # lets you send "" to clear optional fields
        return None if isinstance(v, str) and v.strip() == "" else v

    def update(self, instance, validated_data):
        # Pull the nested user payload produced by `source="user.*"`
        user_data = validated_data.pop("user", {})

        # ---- update ClientProfile fields ----
        for attr, value in validated_data.items():
            setattr(instance, attr, self._blank_to_none(value))
        instance.save()

        # ---- update related User fields (once) ----
        if user_data:
            user = instance.user
            if "first_name" in user_data:
                user.first_name = self._blank_to_none(user_data["first_name"])
            if "last_name" in user_data:
                user.last_name = self._blank_to_none(user_data["last_name"])
            # NOTE: key is profile_picture_url because of source="user.profile_picture_url"
            if "profile_picture_url" in user_data:
                user.profile_picture_url = self._blank_to_none(user_data["profile_picture_url"])
            user.save()

        return instance

class ClientChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = self.context["user"]

        old_pw = attrs["old_password"]
        new_pw = attrs["new_password"]

        if not check_password(old_pw, user.password):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})
        if old_pw == new_pw:
            raise serializers.ValidationError({"new_password": "New password must be different from old password."})

        validate_password(new_pw, user=user)  # Django validators
        return attrs

    def save(self, **kwargs):
        user = self.context["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ClientSendPasswordResetEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.user = None
            return attrs
        self.user = user
        return attrs

    def save(self, **kwargs):
        self.reset_link = None

        user = getattr(self, "user", None)
        if not user:
            return  # silent success to prevent enumeration

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)

        # Prefer FRONTEND_URL if available, otherwise fall back to backend path
        base = getattr(settings, "FRONTEND_URL", os.getenv("FRONTEND_URL", "")).rstrip("/")
        if base:
            link = f"{base}/client/reset-password/{uidb64}/{token}/"
        else:
            # backend fallback path
            link = f"/client/auth/reset-password/{uidb64}/{token}/"

        # DEV: print link and expose it via serializer for convenience
        if getattr(settings, "DEBUG", False):
            print(f"[DEV] Client password reset link: {link}")

        self.reset_link = link
        send_password_reset_email(user, link)


class ClientPasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        uidb64 = self.context["uidb64"]
        token = self.context["token"]

        try:
            pk = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=pk)
        except Exception:
            raise serializers.ValidationError("Invalid reset link.")


        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError("Token is invalid or expired.")

        validate_password(attrs["new_password"], user=user)
        self.user = user
        return attrs

    def save(self, **kwargs):
        user = self.user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
