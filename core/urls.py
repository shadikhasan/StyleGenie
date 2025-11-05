from django.contrib import admin
from django.urls import path, include
from .health import health_check

urlpatterns = [
    path('admin/', admin.site.urls), 
    path('health/', health_check, name='health-check'),      
    path('client/', include('client.urls')),     
    path('stylist/', include('stylist.urls')),     
]
