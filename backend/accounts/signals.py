"""
apps/accounts/signals.py

Signal handlers for automatic profile creation when a new User is created.

Design:
- Users with role = CLIENT → ClientProfile
- Users with role = STYLIST → StylistProfile
- Admins have no auto-profile yet.
"""

# --- Django core ---
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

# --- Local apps ---
from client.models import ClientProfile
from stylist.models import StylistProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_profile_on_user_create(sender, instance: User, created: bool, **kwargs):
    """
    Auto-create related profile when a new User is created.

    - Client → ClientProfile
    - Stylist → StylistProfile
    - Admin → (no automatic profile)
    """
    if not created:
        return

    role = instance.role

    if role == User.Role.CLIENT:
        ClientProfile.objects.get_or_create(user=instance)
        print(f"[signals] Client profile created for user {instance.id}")

    elif role == User.Role.STYLIST:
        StylistProfile.objects.get_or_create(user=instance)
        print(f"[signals] Stylist profile created for user {instance.id}")

    # Admin or others → no profile created
