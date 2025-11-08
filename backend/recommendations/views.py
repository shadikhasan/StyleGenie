from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .serializers import (
    RecommendRequestSerializer,
    RecommendResponseSerializer,
)
from .services import recommend


class RecommendView(APIView):
    """
    Authenticated endpoint:
    - Accepts destination, occasion, datetime
    - Optional drawer_products to override wardrobe
    - Uses request.user.id automatically
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = RecommendRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        try:
            result = recommend(
                user_id=request.user.id,
                destination=data["destination"],
                occasion=data["occasion"],
                dt_iso=data["datetime"].isoformat(),
                drawer_products_override=data.get("drawer_products") or None,
            )
        except ValueError as e:
            # Validation or AI error bubbled up as clean message
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Validate outgoing contract (defensive)
        out = RecommendResponseSerializer(data=result)
        out.is_valid(raise_exception=True)
        return Response(out.data, status=status.HTTP_200_OK)
