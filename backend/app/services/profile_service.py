"""
Profile & User Memory Service
Handles persistent user settings and MetaAgent continuous learning updates in Supabase profiles.
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from app.core.database import get_service_db, get_db
from app.schemas.profile import ProfileUpdate

logger = logging.getLogger(__name__)

# Default category baseline scores (1.0 = standard sensitivity)
DEFAULT_CATEGORY_SCORES = {
    "food": 1.0,
    "utilities": 1.0,
    "transport": 1.0,
    "leisure": 1.0,
    "housing": 1.0,
    "health": 1.0,
    "education": 1.0,
    "other": 1.0,
}


class ProfileService:
    """Manages user profile, persistent memory and sensitivity learning."""

    @staticmethod
    def _get_client():
        return get_service_db() or get_db()

    @staticmethod
    async def get_or_create_profile(user_id: UUID) -> Dict[str, Any]:
        """
        Fetches the user profile from Supabase.
        If it does not exist yet, initializes it with defaults.
        """
        client = ProfileService._get_client()

        fallback_profile = {
            "id": str(user_id),
            "full_name": "Usuario",
            "currency": "ARS",
            "monthly_income": 600000.0,
            "payday": 5,
            "preferred_tone": "neutral",
            "alert_frequency": "normal",
            "category_scores": dict(DEFAULT_CATEGORY_SCORES),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        if client is None:
            return fallback_profile

        try:
            response = client.table("profiles").select("*").eq("id", str(user_id)).execute()
            if response.data:
                profile = response.data[0]
                # Ensure category_scores has all categories
                current_scores = profile.get("category_scores") or {}
                merged_scores = {**DEFAULT_CATEGORY_SCORES, **current_scores}
                profile["category_scores"] = merged_scores
                return profile

            # Profile doesn't exist yet: insert default
            insert_res = client.table("profiles").insert({
                "id": str(user_id),
                "preferred_tone": "neutral",
                "alert_frequency": "normal",
                "category_scores": DEFAULT_CATEGORY_SCORES,
            }).execute()

            if insert_res.data:
                return insert_res.data[0]
            return fallback_profile
        except Exception as e:
            logger.error(f"Error in get_or_create_profile: {e}")
            return fallback_profile

    @staticmethod
    async def update_profile(user_id: UUID, payload: ProfileUpdate) -> Optional[Dict[str, Any]]:
        """Updates user profile settings."""
        client = ProfileService._get_client()
        update_data: Dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}

        if payload.full_name is not None:
            update_data["full_name"] = payload.full_name
        if payload.currency is not None:
            update_data["currency"] = payload.currency
        if payload.monthly_income is not None:
            update_data["monthly_income"] = float(payload.monthly_income)
        if payload.payday is not None:
            update_data["payday"] = payload.payday
        if payload.preferred_tone is not None:
            update_data["preferred_tone"] = payload.preferred_tone
        if payload.alert_frequency is not None:
            update_data["alert_frequency"] = payload.alert_frequency
        if payload.category_scores is not None:
            update_data["category_scores"] = payload.category_scores

        if client is None:
            current = await ProfileService.get_or_create_profile(user_id)
            current.update(update_data)
            return current

        try:
            response = (
                client.table("profiles")
                .update(update_data)
                .eq("id", str(user_id))
                .execute()
            )
            if response.data:
                return response.data[0]
            return await ProfileService.get_or_create_profile(user_id)
        except Exception as e:
            logger.error(f"Error updating profile {user_id}: {e}")
            return None

    @staticmethod
    async def adapt_category_score(
        user_id: UUID,
        category_slug: str,
        useful: bool,
    ) -> Dict[str, Any]:
        """
        Meta-Agent Continuous Learning algorithm:
        - If useful: sensitivity increases by +0.10 (up to max 2.0).
        - If not useful: sensitivity decreases by -0.25 (down to min 0.10) to prevent alert fatigue.
        """
        profile = await ProfileService.get_or_create_profile(user_id)
        category_scores = dict(profile.get("category_scores") or DEFAULT_CATEGORY_SCORES)

        current_score = category_scores.get(category_slug, 1.0)

        if useful:
            new_score = min(2.0, round(current_score + 0.10, 2))
        else:
            new_score = max(0.10, round(current_score - 0.25, 2))

        category_scores[category_slug] = new_score

        # If multiple categories become low sensitivity, adjust frequency if needed
        client = ProfileService._get_client()
        if client is not None:
            try:
                client.table("profiles").update({
                    "category_scores": category_scores,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", str(user_id)).execute()
            except Exception as e:
                logger.error(f"Error updating adapted category scores: {e}")

        return {
            "category_slug": category_slug,
            "previous_score": current_score,
            "new_score": new_score,
            "all_scores": category_scores,
        }
