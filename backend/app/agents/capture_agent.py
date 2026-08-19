"""
Capture & Ingestion Agent (OODA Phase 1: Observe)
Validates and structures financial input candidates.
"""

import time
import logging
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult
from app.services.db_service import DatabaseService

logger = logging.getLogger(__name__)


class CaptureAgent(BaseAgent):
    """
    Transforms raw inputs into validated expense records and initiates the OODA cycle.
    """

    def __init__(self):
        super().__init__(name="capture")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()

        if context.expense is None:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return AgentResult(
                agent_name=self.name,
                status="failed",
                duration_ms=duration_ms,
                output={"error": "No expense data present in AgentContext to capture."},
            )

        expense = context.expense
        amount = float(expense.amount)
        valid = amount > 0 and expense.category_id is not None

        output_data = {
            "expense_id": str(expense.id),
            "amount": amount,
            "merchant": expense.merchant,
            "category_id": str(expense.category_id),
            "source": expense.source,
            "validated": valid,
        }

        duration_ms = max(1, int((time.perf_counter() - start_time) * 1000))

        # Observability trace logging
        await DatabaseService.log_agent_event(
            user_id=context.user_id,
            request_id=context.request_id,
            agent_name=self.name,
            event_type="expense_captured",
            input_data={"source": expense.source, "amount": amount},
            output_data=output_data,
            status="success" if valid else "failed",
            duration_ms=duration_ms,
        )

        return AgentResult(
            agent_name=self.name,
            status="success" if valid else "failed",
            duration_ms=duration_ms,
            output=output_data,
        )
