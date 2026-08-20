"""
Profile & Memory Endpoints (/api/v1/profile)
Manages user preferences and persistent MetaAgent memory state.
"""

from fastapi import APIRouter, HTTPException, status
from app.api.dependencies import CurrentUser
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["Profile & Memory"])


@router.get("", response_model=ProfileResponse)
async def get_profile(user_id: CurrentUser):
    """
    Retrieves the user profile and persistent memory:
    - preferred tone (neutral, friendly, direct)
    - alert frequency (low, normal, high)
    - dynamic category sensitivity weights learned by the MetaAgent
    """
    profile = await ProfileService.get_or_create_profile(user_id)
    return profile


@router.put("", response_model=ProfileResponse)
async def update_profile(payload: ProfileUpdate, user_id: CurrentUser):
    """
    Updates user settings and preferences.
    """
    updated = await ProfileService.update_profile(user_id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile.",
        )
    return updated
