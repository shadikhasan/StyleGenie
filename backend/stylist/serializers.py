# apps/stylist/serializers.py
import os
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, smart_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from common.utils import get_tokens_for_user, send_password_reset_email
from stylist.models import StylistProfile  # adjust path to your app

User = get_user_model()


class StylistRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "username", "password", "phone", "profile_picture"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.setdefault("role", "stylist")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class StylistLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")

        user = authenticate(request=self.context.get("request"), email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")

        tokens = get_tokens_for_user(user)
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


class StylistUserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "phone", "profile_picture", "role", "status"]
        read_only_fields = fields


class StylistProfileSerializer(serializers.ModelSerializer):
    user = StylistUserBasicSerializer(read_only=True)

    class Meta:
        model = StylistProfile
        fields = [
            "user",
            "bio",
            "expertise",
            "years_experience",
            "rating",
            "rating_count",
            "earnings_total",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["rating", "rating_count", "earnings_total", "created_at", "updated_at"]


class StylistChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = self.context["user"]
        old_pw, new_pw = attrs["old_password"], attrs["new_password"]

        if not check_password(old_pw, user.password):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})
        if old_pw == new_pw:
            raise serializers.ValidationError({"new_password": "New password must be different from old password."})

        validate_password(new_pw, user=user)
        return attrs

    def save(self, **kwargs):
        user = self.context["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class StylistSendPasswordResetEmailSerializer(serializers.Serializer):
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
            return

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)

        base = getattr(settings, "FRONTEND_URL", os.getenv("FRONTEND_URL", "")).rstrip("/")
        if base:
            link = f"{base}/stylist/reset-password/{uidb64}/{token}/"
        else:
            link = f"/stylist/auth/reset-password/{uidb64}/{token}/"

        if getattr(settings, "DEBUG", False):
            print(f"[DEV] Stylist password reset link: {link}")

        self.reset_link = link
        send_password_reset_email(user, link)


class StylistPasswordResetSerializer(serializers.Serializer):
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
