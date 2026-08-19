"""
Planner & Forecaster Agent (OODA Phase 3: Decide)
Calculates budget remaining, free daily cash and end-of-month forecasts.
"""

import time
import logging
from decimal import Decimal
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult
from app.schemas.analysis import FinancialProjection
from app.services.financial_service import FinancialService
from app.services.db_service import DatabaseService

logger = logging.getLogger(__name__)


class PlannerAgent(BaseAgent):
    """
    Evaluates financial trajectory post-expense: available daily allowance and budget overrun risk.
    """

    def __init__(self):
        super().__init__(name="planner")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()

        metrics = await FinancialService.calculate_monthly_metrics(user_id=context.user_id)

        budget_summary = metrics["budget"]
        proj_summary = metrics["projection"]
        meta = metrics.get("meta", {})

        status = proj_summary["status"]
        if status == "over_budget":
            budget_risk = "high"
        elif status == "warning":
            budget_risk = "medium"
        else:
            budget_risk = "low"

        projection = FinancialProjection(
            remaining_budget=Decimal(str(budget_summary["remaining"])),
            remaining_days=int(meta.get("remaining_days", 1)),
            available_per_day=Decimal(str(metrics["available_today"])),
            projected_monthly_spending=Decimal(str(proj_summary["projected_total"])),
            projected_savings=Decimal(str(proj_summary["projected_savings"])),
            budget_risk=budget_risk,
        )
        context.projection = projection

        duration_ms = max(1, int((time.perf_counter() - start_time) * 1000))
        output_data = {
            "available_per_day": float(projection.available_per_day),
            "remaining_budget": float(projection.remaining_budget),
            "projected_total": float(projection.projected_monthly_spending),
            "projected_savings": float(projection.projected_savings),
            "budget_risk": budget_risk,
            "remaining_days": projection.remaining_days,
        }

        # Observability trace logging
        await DatabaseService.log_agent_event(
            user_id=context.user_id,
            request_id=context.request_id,
            agent_name=self.name,
            event_type="financial_planned",
            input_data={"user_id": str(context.user_id)},
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
