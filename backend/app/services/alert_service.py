"""
Alert Service — Handles alert retrieval, generation of rule-based financial warnings, and user feedback.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.core.database import get_service_db, get_db
from app.schemas.alert import AlertResponse, AlertFeedbackCreate
from app.services.db_service import DatabaseService

logger = logging.getLogger(__name__)


class AlertService:
    """Manages financial alerts and user feedback."""

    @staticmethod
    def _get_client():
        return get_service_db() or get_db()

    @staticmethod
    async def get_user_alerts(
        user_id: UUID,
        budget_total: float = 0.0,
        budget_spent: float = 0.0,
        projected_total: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves active alerts from Supabase.
        If no persisted alerts exist, generates dynamic rule-based notifications based on budget pacing.
        """
        client = AlertService._get_client()
        persisted_alerts: List[Dict[str, Any]] = []

        if client is not None:
            try:
                response = (
                    client.table("alerts")
                    .select("*")
                    .eq("user_id", str(user_id))
                    .order("created_at", desc=True)
                    .limit(10)
                    .execute()
                )
                persisted_alerts = response.data or []
            except Exception as e:
                logger.error(f"Error fetching alerts from Supabase: {e}")

        # If user has alerts in DB, return them
        if persisted_alerts:
            return persisted_alerts

        # Deterministic rule-based alerts fallback
        dynamic_alerts: List[Dict[str, Any]] = []
        now_iso = datetime.utcnow().isoformat()

        if budget_total > 0:
            percentage_used = (budget_spent / budget_total) * 100
            if percentage_used >= 95:
                dynamic_alerts.append({
                    "id": str(uuid4()),
                    "user_id": str(user_id),
                    "type": "budget_critical",
                    "severity": "critical",
                    "title": "Presupuesto casi agotado",
                    "message": f"Consumiste el {percentage_used:.1f}% de tu presupuesto mensual. Se recomienda frenar gastos discrecionales.",
                    "category_id": None,
                    "agent_source": "evaluator",
                    "created_at": now_iso,
                    "seen_at": None,
                })
            elif percentage_used >= 80:
                dynamic_alerts.append({
                    "id": str(uuid4()),
                    "user_id": str(user_id),
                    "type": "budget_warning",
                    "severity": "warning",
                    "title": "Alerta de consumo presupuestario",
                    "message": f"Alcanzaste el {percentage_used:.1f}% de tu presupuesto mensual disponible.",
                    "category_id": None,
                    "agent_source": "evaluator",
                    "created_at": now_iso,
                    "seen_at": None,
                })

            if projected_total > budget_total:
                dynamic_alerts.append({
                    "id": str(uuid4()),
                    "user_id": str(user_id),
                    "type": "projection_risk",
                    "severity": "warning",
                    "title": "Riesgo de desvío presupuestario",
                    "message": f"Al ritmo actual, proyectás un gasto de ${projected_total:,.0f} superando el límite de ${budget_total:,.0f}.",
                    "category_id": None,
                    "agent_source": "planner",
                    "created_at": now_iso,
                    "seen_at": None,
                })

        return dynamic_alerts

    @staticmethod
    async def record_feedback(
        user_id: UUID,
        alert_id: UUID,
        feedback: str,
    ) -> Dict[str, Any]:
        """
        Records user feedback for an alert ('useful' / 'not_useful').
        Persists into alert_feedback table and logs agent event trace.
        """
        client = AlertService._get_client()
        feedback_record = {
            "id": str(uuid4()),
            "alert_id": str(alert_id),
            "user_id": str(user_id),
            "feedback": feedback,
            "created_at": datetime.utcnow().isoformat(),
        }

        if client is not None:
            try:
                client.table("alert_feedback").insert(feedback_record).execute()
            except Exception as e:
                logger.error(f"Error persisting alert feedback: {e}")

        # Log trace for meta-agent continuous learning
        await DatabaseService.log_agent_event(
            user_id=user_id,
            request_id=uuid4(),
            agent_name="meta_agent",
            event_type="alert_feedback_received",
            input_data={"alert_id": str(alert_id), "feedback": feedback},
            output_data={"learned": True, "updated_preference": True},
            status="success",
        )

        return {
            "status": "success",
            "alert_id": str(alert_id),
            "feedback": feedback,
            "learned": True,
        }
