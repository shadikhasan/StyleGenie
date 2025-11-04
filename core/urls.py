from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),         # Optional   # Backend API endpoints
    path('client/', include('client.urls')),     # Backend API endpoints
]
