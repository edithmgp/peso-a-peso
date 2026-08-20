"""
Database Repository Service for Supabase Queries
"""

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID
from app.core.database import get_db, get_service_db

logger = logging.getLogger(__name__)


class DatabaseService:
    """Provides structured helper methods for querying Supabase PostgreSQL tables."""

    @staticmethod
    async def get_categories() -> List[Dict[str, Any]]:
        """Fetches all predefined categories."""
        client = get_service_db() or get_db()
        if client is None:
            # Fallback mock data when Supabase is not connected
            return [
                {"id": "c0000000-0000-0000-0000-000000000001", "name": "Comida", "slug": "food"},
                {"id": "c0000000-0000-0000-0000-000000000002", "name": "Servicios", "slug": "utilities"},
                {"id": "c0000000-0000-0000-0000-000000000003", "name": "Transporte", "slug": "transport"},
                {"id": "c0000000-0000-0000-0000-000000000004", "name": "Ocio", "slug": "leisure"},
                {"id": "c0000000-0000-0000-0000-000000000005", "name": "Vivienda", "slug": "housing"},
                {"id": "c0000000-0000-0000-0000-000000000006", "name": "Salud", "slug": "health"},
                {"id": "c0000000-0000-0000-0000-000000000007", "name": "Educación", "slug": "education"},
                {"id": "c0000000-0000-0000-0000-000000000008", "name": "Otros", "slug": "other"},
            ]
        try:
            response = client.table("categories").select("*").execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error querying categories: {e}")
            return []

    @staticmethod
    async def get_user_profile(user_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetches profile for given user UUID."""
        client = get_db()
        if client is None:
            return {
                "id": str(user_id),
                "full_name": "Usuario Demo",
                "currency": "ARS",
                "monthly_income": 600000.0,
                "payday": 5,
            }
        try:
            response = client.table("profiles").select("*").eq("id", str(user_id)).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error querying user profile: {e}")
            return None

    @staticmethod
    async def log_agent_event(
        user_id: UUID,
        request_id: UUID,
        agent_name: str,
        event_type: str,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        status: str = "success",
        duration_ms: int = 0,
    ) -> bool:
        """Persists agent execution trace to agent_events table for observability."""
        client = get_service_db() or get_db()
        if client is None:
            logger.info(f"[AgentEvent Trace] {agent_name} ({event_type}) - status: {status} in {duration_ms}ms")
            return True
        try:
            client.table("agent_events").insert({
                "user_id": str(user_id),
                "request_id": str(request_id),
                "agent_name": agent_name,
                "event_type": event_type,
                "input_data": input_data or {},
                "output_data": output_data or {},
                "status": status,
                "duration_ms": duration_ms,
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error logging agent event: {e}")
            return False
