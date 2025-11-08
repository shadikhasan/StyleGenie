# apps/stylegen/models.py
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class StylistProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="stylist_profile")
    bio = models.TextField(null=True, blank=True)
    expertise = models.JSONField(null=True, blank=True, help_text="Tags like: ['streetwear','formal','vintage']")
    years_experience = models.PositiveIntegerField(null=True, blank=True)
    rating = models.FloatField(default=0.0)
    rating_count = models.PositiveIntegerField(default=0)
    earnings_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): 
        return f"StylistProfile<{self.user.username}>"
