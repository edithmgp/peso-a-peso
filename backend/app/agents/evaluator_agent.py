"""
Alert Evaluator & Filter Agent (OODA Phase 4: Act)
Critical decision filter deciding whether financial findings warrant generating and persisting a user alert,
taking into account the user's persistent profile memory and category sensitivity weights.
"""

import time
import logging
from datetime import datetime
from uuid import uuid4
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult, EvaluationResult
from app.core.database import get_service_db, get_db
from app.services.db_service import DatabaseService
from app.services.profile_service import ProfileService
from app.services.category_service import CategoryService

logger = logging.getLogger(__name__)


class EvaluatorAgent(BaseAgent):
    """
    Critical evaluation filter: assesses anomaly and projection data against user profile memory
    to determine if an alert must be issued and saved into the database.
    """

    def __init__(self):
        super().__init__(name="evaluator")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()

        analysis = context.analysis
        projection = context.projection
        expense = context.expense

        # 1. Fetch persistent profile memory
        profile = await ProfileService.get_or_create_profile(context.user_id)
        alert_frequency = profile.get("alert_frequency", "normal")
        category_scores = profile.get("category_scores") or {}

        # Resolve category slug
        category_slug = "other"
        if expense:
            categories = await CategoryService.get_all()
            for c in categories:
                if c["id"] == str(expense.category_id):
                    category_slug = c["slug"]
                    break

        cat_sensitivity = float(category_scores.get(category_slug, 1.0))

        should_alert = False
        severity = "info"
        reason = "Gasto registrado dentro de parámetros normales."
        recommendation = "Tu ritmo de gasto está controlado."

        if expense is not None and projection is not None:
            avail_str = f"${float(projection.available_per_day):,.0f}"
            recommendation = f"Gasto registrado. Tu disponible libre para hoy es de {avail_str}."

        # 2. Rule evaluation
        if analysis and analysis.anomaly_detected:
            should_alert = True
            severity = "warning" if analysis.risk_level == "medium" else "critical"
            reason = "Consumo individual anómalo detectado."
            if expense:
                recommendation = (
                    f"El gasto de ${float(expense.amount):,.0f} en {expense.merchant or 'comercio'} "
                    f"superó en {float(analysis.spending_velocity):.0f}% el promedio habitual. "
                    "Te recomendamos vigilar el consumo en esta categoría."
                )
        elif projection and projection.budget_risk in ["medium", "high"]:
            should_alert = True
            severity = "warning" if projection.budget_risk == "medium" else "critical"
            reason = "Riesgo de desvío presupuestario al cierre de mes."
            recommendation = (
                f"Al ritmo de consumo actual, se proyecta un cierre de ${float(projection.projected_monthly_spending):,.0f}. "
                "Te sugerimos priorizar gastos esenciales en los días restantes."
            )

        # 3. Memory Filtering: apply learned category sensitivities and user frequency preferences
        suppressed_by_memory = False
        if should_alert and severity != "critical":
            # If user marked alerts in this category as not useful repeatedly (sensitivity < 0.60), suppress warning
            if cat_sensitivity < 0.60:
                should_alert = False
                suppressed_by_memory = True
                reason += f" (Alerta atenuada por preferencia aprendida en '{category_slug}': score {cat_sensitivity})"
            elif alert_frequency == "low":
                should_alert = False
                suppressed_by_memory = True
                reason += " (Alerta suprimida por preferencia de frecuencia baja)"

        context.evaluation = EvaluationResult(
            should_alert=should_alert,
            severity=severity,
            reason=reason,
            recommendation=recommendation,
        )

        # 4. Persist alert into Supabase if condition is met
        alert_id = None
        if should_alert:
            client = get_service_db() or get_db()
            if client is not None:
                try:
                    alert_id = str(uuid4())
                    client.table("alerts").insert({
                        "id": alert_id,
                        "user_id": str(context.user_id),
                        "type": "anomaly_detected" if (analysis and analysis.anomaly_detected) else "budget_pacing",
                        "severity": severity,
                        "title": "Alerta de Consumo" if severity != "critical" else "Alerta Crítica de Presupuesto",
                        "message": recommendation,
                        "category_id": str(expense.category_id) if expense else None,
                        "agent_source": self.name,
                        "created_at": datetime.utcnow().isoformat(),
                        "seen_at": None,
                    }).execute()
                except Exception as e:
                    logger.error(f"Error persisting evaluator alert: {e}")

        duration_ms = max(1, int((time.perf_counter() - start_time) * 1000))
        output_data = {
            "should_alert": should_alert,
            "severity": severity,
            "reason": reason,
            "recommendation": recommendation,
            "persisted_alert_id": alert_id,
            "category_sensitivity": cat_sensitivity,
            "suppressed_by_memory": suppressed_by_memory,
        }

        # Observability trace logging
        await DatabaseService.log_agent_event(
            user_id=context.user_id,
            request_id=context.request_id,
            agent_name=self.name,
            event_type="alert_evaluated",
            input_data={
                "anomaly_detected": analysis.anomaly_detected if analysis else False,
                "budget_risk": projection.budget_risk if projection else "low",
                "category_sensitivity": cat_sensitivity,
            },
            output_data=output_data,
            status="success",
            duration_ms=duration_ms,
        )

        return AgentResult(
            agent_name=self.name,
            status="success",
            duration_ms=duration_ms,
            output=output_data,
        )
