"""
Agent Events & Observability Endpoints (/api/v1/agent-events)
Allows querying multi-agent OODA execution traces.
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from fastapi import APIRouter, Query
from app.api.dependencies import CurrentUser
from app.core.database import get_service_db, get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent-events", tags=["Agent Events"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_agent_events(
    user_id: CurrentUser,
    limit: int = Query(50, ge=1, le=100),
    agent_name: Optional[str] = None,
):
    """
    Returns recent agent execution traces for observability and auditing.
    """
    client = get_service_db() or get_db()
    if client is None:
        return []

    try:
        query = (
            client.table("agent_events")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(limit)
        )
        if agent_name:
            query = query.eq("agent_name", agent_name)

        response = query.execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching agent events: {e}")
        return []


@router.get("/cycle/{request_id}", response_model=List[Dict[str, Any]])
async def get_cycle_events(request_id: UUID, user_id: CurrentUser):
    """
    Retrieves all ordered agent steps (Capture -> Analyzer -> Planner -> Evaluator)
    for a specific OODA request cycle.
    """
    client = get_service_db() or get_db()
    if client is None:
        return []

    try:
        response = (
            client.table("agent_events")
            .select("*")
            .eq("request_id", str(request_id))
            .eq("user_id", str(user_id))
            .order("created_at", desc=False)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetching cycle events: {e}")
        return []
