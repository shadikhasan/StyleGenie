from rest_framework import serializers


class DrawerProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    color = serializers.CharField()
    category = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)


class RecommendRequestSerializer(serializers.Serializer):
    """
    Minimal payload from frontend.
    drawer_products is optional; if not provided we fetch from DB.
    """
    destination = serializers.CharField(max_length=100)
    occasion = serializers.CharField(max_length=50)
    datetime = serializers.DateTimeField()  # ISO 8601
    drawer_products = serializers.ListField(
        child=DrawerProductSerializer(), required=False, default=list
    )


class RecommendItemSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField()
    product_ids = serializers.ListField(child=serializers.IntegerField())


class RecommendResponseSerializer(serializers.Serializer):
    recommendations = serializers.ListField(child=RecommendItemSerializer())
