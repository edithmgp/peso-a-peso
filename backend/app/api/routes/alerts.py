"""
Alerts & Feedback Endpoints (/api/v1/alerts)
Connected to AlertService and MetaAgent continuous learning loop.
"""

from typing import Any, Dict, List
from uuid import UUID, uuid4
from fastapi import APIRouter, status
from app.api.dependencies import CurrentUser
from app.schemas.alert import AlertResponse, AlertFeedbackCreate
from app.schemas.agents import AgentContext
from app.services.alert_service import AlertService
from app.orchestrator.orchestrator import orchestrator

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(user_id: CurrentUser):
    """Retrieves user alerts and recommendations."""
    return await AlertService.get_user_alerts(user_id)


@router.post("/{alert_id}/feedback", status_code=status.HTTP_200_OK)
async def submit_alert_feedback(
    alert_id: UUID,
    payload: AlertFeedbackCreate,
    user_id: CurrentUser,
) -> Dict[str, Any]:
    """
    Submits user feedback ('useful'/'not_useful') which persists to alert_feedback
    and triggers the Continuous Learning Meta-Agent cycle to adapt category sensitivity.
    """
    # 1. Record feedback in DB
    result = await AlertService.record_feedback(
        user_id=user_id,
        alert_id=alert_id,
        feedback=payload.feedback,
    )

    # 2. Trigger MetaAgent continuous learning cycle
    context = AgentContext(
        request_id=uuid4(),
        user_id=user_id,
        metadata={
            "alert_id": str(alert_id),
            "feedback": payload.feedback,
        },
    )
    await orchestrator.run_feedback_cycle(context)

    return result
