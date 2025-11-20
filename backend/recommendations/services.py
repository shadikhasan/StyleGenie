from datetime import datetime
from typing import Dict, Any, List, Optional, Union

from django.shortcuts import get_object_or_404

from accounts.models import User
from client.models import ClientProfile

from agents.style_agent import get_outfit_recommendations, StylistRequestPayload, AIRecommendations


# Required profile fields for the AI
REQUIRED_PROFILE_FIELDS = ("gender", "skin_tone", "face_shape", "body_shape")


def _map_skin_tone(v: Optional[str]) -> Optional[str]:
    """Convert app skin tone values to what the AI expects."""
    if not v:
        return v
    mapping = {
        "fair": "white",
        "light": "white",
        "medium": "wheat",
        "tan": "tan",
        "olive": "olive",
        "brown": "brown",
        "dark": "dark",
    }
    return mapping.get(v.lower(), v)


def _validate_profile(profile: ClientProfile) -> List[str]:
    """Return a list of missing required fields on the profile."""
    return [f for f in REQUIRED_PROFILE_FIELDS if not getattr(profile, f, None)]


def _fetch_drawer_products_from_db(user: User) -> List[Dict[str, Any]]:
    """
    Query the user's wardrobe and map to what the AI expects.
    """
    try:
        from client.models import WardrobeItem
    except Exception:
        return []

    qs = (
        WardrobeItem.objects.filter(user=user)
        .only("id", "title", "color", "category", "description")
        .order_by("-id")[:20]
    )

    out: List[Dict[str, Any]] = []
    for i in qs:
        out.append({
            "id": i.id,
            "title": i.title,
            "color": i.color,
            "category": getattr(i, "category", "") or "",
            "description": getattr(i, "description", "") or "",
        })
    return out


def recommend(
    *,
    user_id: int,
    destination: str,
    occasion: str,
    dt_iso: str,
    drawer_products_override: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Build payload from stored profile (+ optional drawer override), call local stylist agent,
    and return structured AIRecommendations.
    """
    user = get_object_or_404(User, pk=user_id)
    profile = get_object_or_404(ClientProfile, user=user)

    # 1) Validate required profile data
    missing = _validate_profile(profile)
    if missing:
        raise ValueError(f"Missing required profile fields: {', '.join(missing)}")

    # 2) Get drawer products: prefer client override; else load from DB
    drawer_products = (drawer_products_override or []) or _fetch_drawer_products_from_db(user)
    if not drawer_products:
        raise ValueError("You have no wardrobe items yet. Please add at least one item.")

    # 2.5) Parse datetime (optional / tolerant)
    dt_value: Optional[datetime] = None
    if dt_iso:
        try:
            # Python 3.11: fromisoformat handles offsets like +06:00
            dt_value = datetime.fromisoformat(dt_iso)
        except Exception:
            # If parsing fails, we just ignore and continue without datetime
            dt_value = None
            
    # 3) Build payload for your agent
    payload: StylistRequestPayload = StylistRequestPayload(
        user_info={
            "gender": profile.gender,
            "skin_tone": _map_skin_tone(profile.skin_tone),
            "color_preferences": (getattr(profile, "style_preferences", {}) or {}).get("colors", []),
            "face_shape": profile.face_shape,
            "body_shape": profile.body_shape,
        },
        drawer_products=drawer_products,
        location=destination,
        occasion=occasion,
        datetime=dt_value,
    )

    # 4) Call your local LangChain agent
    structured_result: AIRecommendations = get_outfit_recommendations(payload)

    # 5) Return the structured dict (instead of hitting API)
    return structured_result.model_dump()
