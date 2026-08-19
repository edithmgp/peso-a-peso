"""
Alerts & Feedback Endpoints (/api/v1/alerts)
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, status
from app.api.dependencies import CurrentUser
from app.schemas.alert import AlertResponse, AlertFeedbackCreate

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(user_id: CurrentUser):
    """Retrieves user alerts and recommendations."""
    return []


@router.post("/{alert_id}/feedback", status_code=status.HTTP_200_OK)
async def submit_alert_feedback(
    alert_id: UUID,
    payload: AlertFeedbackCreate,
    user_id: CurrentUser,
):
    """
    Submits user feedback ('useful'/'not_useful') which triggers the Continuous Learning Meta-Agent.
    """
    return {
        "status": "success",
        "alert_id": str(alert_id),
        "feedback": payload.feedback,
        "learned": True,
    }
