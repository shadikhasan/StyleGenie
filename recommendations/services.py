import requests
from typing import Dict, Any, List, Optional
from django.shortcuts import get_object_or_404

from accounts.models import User
from client.models import ClientProfile

# ===== Hardcoded AI service config (per your request) =====
AI_REC_BASE_URL = "http://158.220.126.38:8000"
AI_REC_PATH = "/api/v1/recommendations/recommend"
AI_REC_TIMEOUTS = (3.0, 15.0)  # (connect, read)
AI_REC_AUTH_TOKEN = "9f8b9c2d5a63e1f60c7e3e2d98b4c4hdjahbf28d2f72afbb8a6a83f0dc3a23b67"

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
    Adjust the import and field names to match your model.
    """
    try:
        from client.models import WardrobeItem  # ← CHANGE if your app/model differs
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
    Build payload from stored profile (+ optional drawer override), call AI microservice,
    and return its JSON.
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
        # AI requires at least one product
        raise ValueError("You have no wardrobe items yet. Please add at least one item.")

    # 3) Build AI payload
    payload = {
        "user_info": {
            "gender": profile.gender,
            "skin_tone": _map_skin_tone(profile.skin_tone),
            "color_preferences": (getattr(profile, "style_preferences", {}) or {}).get("colors", []),
            "face_shape": profile.face_shape,
            "body_shape": profile.body_shape,
        },
        "drawer_products": drawer_products,
        "location": destination,
        "occasion": occasion,
        # "datetime": dt_iso,  # Uncomment if your AI service accepts/uses it
    }

    # 4) Call AI microservice
    url = f"{AI_REC_BASE_URL}{AI_REC_PATH}"
    headers = {
        "Content-Type": "application/json",
        "X-Auth-Token": AI_REC_AUTH_TOKEN,  # required by your AI service
    }

    res = requests.post(url, json=payload, headers=headers, timeout=AI_REC_TIMEOUTS)
    try:
        res.raise_for_status()
    except requests.HTTPError as e:
        # Surface microservice error body clearly
        try:
            error_data = res.json()
        except Exception:
            error_data = {"detail": res.text}
        raise ValueError(f"AI service error: {error_data}") from e

    return res.json()
