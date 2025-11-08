from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ClientProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        NON_BINARY = "non_binary", "Non-binary"
        OTHER = "other", "Other"
        PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"

    class SkinTone(models.TextChoices):
        FAIR = "fair", "Fair"
        LIGHT = "light", "Light"
        MEDIUM = "medium", "Medium"
        TAN = "tan", "Tan"
        OLIVE = "olive", "Olive"
        BROWN = "brown", "Brown"
        DARK = "dark", "Dark"

    class BodyShape(models.TextChoices):
        RECTANGLE = "rectangle", "Rectangle"
        HOURGLASS = "hourglass", "Hourglass"
        PEAR = "pear", "Pear"
        APPLE = "apple", "Apple"
        INVERTED_TRIANGLE = "inverted_triangle", "Inverted triangle"

    class FaceShape(models.TextChoices):
        OVAL = "oval", "Oval"
        ROUND = "round", "Round"
        SQUARE = "square", "Square"
        HEART = "heart", "Heart"
        DIAMOND = "diamond", "Diamond"
        OBLONG = "oblong", "Oblong"

    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name="client_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, null=True, blank=True)
    skin_tone = models.CharField(max_length=20, choices=SkinTone.choices, null=True, blank=True)
    body_shape = models.CharField(max_length=20, choices=BodyShape.choices, null=True, blank=True)
    face_shape = models.CharField(max_length=20, choices=FaceShape.choices, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): 
        return f"ClientProfile<{self.user.username}>"


class WardrobeItem(models.Model):
    class Color(models.TextChoices):
        BLACK = "black", "Black"
        WHITE = "white", "White"
        GRAY = "gray", "Gray"
        BLUE = "blue", "Blue"
        RED = "red", "Red"
        GREEN = "green", "Green"
        YELLOW = "yellow", "Yellow"
        BEIGE = "beige", "Beige"
        BROWN = "brown", "Brown"
        PINK = "pink", "Pink"
        PURPLE = "purple", "Purple"
        OTHER = "other", "Other"

    class Category(models.TextChoices):
        TOP = "top", "Top"
        BOTTOM = "bottom", "Bottom"
        OUTERWEAR = "outerwear", "Outerwear"
        FOOTWEAR = "footwear", "Footwear"
        ACCESSORY = "accessory", "Accessory"
        DRESS = "dress", "Dress"
        SUIT = "suit", "Suit"
        OTHER = "other", "Other"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wardrobe_items")
    image_url = models.URLField()
    title = models.CharField(max_length=255)
    color = models.CharField(max_length=20, choices=Color.choices)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.title} ({self.category}) - {self.user.username}"