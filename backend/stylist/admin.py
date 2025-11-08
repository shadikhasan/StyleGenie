from django.contrib import admin

from stylist.models import StylistProfile

@admin.register(StylistProfile)
class StylistProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "years_experience", "rating", "rating_count", "earnings_total", "created_at")
    search_fields = ("user__username", "user__email")
