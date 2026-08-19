"""
Pattern Analyzer Agent (OODA Phase 2: Orient)
Analyzes consumption patterns, statistical deviations and detects financial anomalies.
"""

import time
import math
import logging
from decimal import Decimal
from typing import List
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult
from app.schemas.analysis import FinancialAnalysis
from app.core.database import get_service_db, get_db
from app.services.db_service import DatabaseService

logger = logging.getLogger(__name__)


class AnalyzerAgent(BaseAgent):
    """
    Analyzes historical category spending, detects anomalous spikes and calculates spending velocity.
    Rule: Flag anomaly when an individual expense exceeds historical category average by > 40%.
    """

    def __init__(self):
        super().__init__(name="analyzer")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()

        if context.expense is None:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return AgentResult(
                agent_name=self.name,
                status="failed",
                duration_ms=duration_ms,
                output={"error": "Missing expense in context to analyze."},
            )

        expense = context.expense
        amount = float(expense.amount)
        category_id = str(expense.category_id)
        user_id = str(context.user_id)

        client = get_service_db() or get_db()
        historical_amounts: List[float] = []

        if client is not None:
            try:
                response = (
                    client.table("expenses")
                    .select("amount")
                    .eq("user_id", user_id)
                    .eq("category_id", category_id)
                    .neq("id", str(expense.id))
                    .limit(50)
                    .execute()
                )
                historical_amounts = [float(r["amount"]) for r in (response.data or [])]
            except Exception as e:
                logger.error(f"Error querying historical expenses: {e}")

        # Statistical calculations
        if len(historical_amounts) >= 2:
            cat_avg = sum(historical_amounts) / len(historical_amounts)
            variance = sum((x - cat_avg) ** 2 for x in historical_amounts) / len(historical_amounts)
            std_dev = math.sqrt(variance)
        elif len(historical_amounts) == 1:
            cat_avg = historical_amounts[0]
            std_dev = cat_avg * 0.2
        else:
            # Cold start fallback
            cat_avg = amount
            std_dev = 0.0

        # Anomaly detection rule: expense exceeds average by > 40%
        anomaly_detected = False
        anomaly_score = 0.0

        if cat_avg > 0:
            deviation_pct = ((amount - cat_avg) / cat_avg) * 100.0
            anomaly_score = round(min(1.0, max(0.0, (amount / cat_avg) / 2.0)), 2)
            if amount > (cat_avg * 1.40) and len(historical_amounts) >= 1:
                anomaly_detected = True
        else:
            deviation_pct = 0.0

        # Risk level determination
        if anomaly_detected and deviation_pct > 80:
            risk_level = "high"
        elif anomaly_detected or deviation_pct > 30:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Populate context.analysis
        analysis = FinancialAnalysis(
            daily_average=Decimal(str(round(cat_avg, 2))),
            category_average=Decimal(str(round(cat_avg, 2))),
            category_deviation=Decimal(str(round(std_dev, 2))),
            spending_velocity=Decimal(str(round(deviation_pct, 2))),
            anomaly_detected=anomaly_detected,
            anomaly_score=Decimal(str(anomaly_score)),
            risk_level=risk_level,
        )
        context.analysis = analysis

        duration_ms = max(1, int((time.perf_counter() - start_time) * 1000))
        output_data = {
            "category_average": round(cat_avg, 2),
            "deviation_pct": round(deviation_pct, 2),
            "anomaly_detected": anomaly_detected,
            "anomaly_score": anomaly_score,
            "risk_level": risk_level,
        }

        # Observability trace logging
        await DatabaseService.log_agent_event(
            user_id=context.user_id,
            request_id=context.request_id,
            agent_name=self.name,
            event_type="pattern_analyzed",
            input_data={"amount": amount, "category_id": category_id},
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
