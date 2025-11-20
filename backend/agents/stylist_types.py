# types.py
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# ---------- Request types ----------

class UserInfo(BaseModel):
    gender: str
    skin_tone: str
    color_preferences: List[str] = Field(default_factory=list)
    face_shape: Optional[str] = None
    body_shape: Optional[str] = None


class DrawerProduct(BaseModel):
    """
    One item from drawer_products. Extra fields are allowed so
    you don't have to keep this in perfect sync with the DB model.
    """
    id: int = Field(..., description="Backend product id")
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None

    class Config:
        extra = "allow"  # allow any other keys coming from your API


class StylistRequestPayload(BaseModel):
    """
    This matches the payload you are already building in Django.
    """
    user_info: UserInfo
    drawer_products: List[DrawerProduct]
    location: Optional[str] = None
    occasion: Optional[str] = None
    event_datetime: Optional[datetime] = Field(
        default=None,
        alias="datetime",
        description="When the outfit will be worn (ISO8601 datetime).",
    )

# ---------- Response types ----------

class Recommendation(BaseModel):
    name: str = Field(..., description="Short, catchy outfit name")
    description: str = Field(..., description="Why this outfit works for the user")
    product_ids: List[int] = Field(
        ..., description="IDs from drawer_products that belong to this outfit"
    )


class AIRecommendations(BaseModel):
    recommendations: List[Recommendation] = Field(
        ..., description="List of generated outfit recommendations"
    )
