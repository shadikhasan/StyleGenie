from django.http import JsonResponse
from django.db import connection
import os

def health_check(request):
    try:
        connection.ensure_connection()
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    overall_status = "ok" if db_status == "ok" else "error"
    http_status = 200 if overall_status == "ok" else 500

    return JsonResponse(
        {
            "status": overall_status,
            "database": db_status,
            "environment": os.getenv("DJANGO_ENV", "development"),
            "version": os.getenv("APP_VERSION", "1.0.0")
        },
        status=http_status
    )
