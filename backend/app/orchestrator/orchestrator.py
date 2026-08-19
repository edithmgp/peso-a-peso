"""
Central OODA Orchestrator
Coordinates multi-agent execution pipeline through structured AgentContext.
"""

import time
import logging
from typing import Dict, Any, List
from app.agents.capture_agent import CaptureAgent
from app.agents.analyzer_agent import AnalyzerAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.evaluator_agent import EvaluatorAgent
from app.agents.meta_agent import MetaAgent
from app.schemas.agents import AgentContext, AgentResult
from app.services.db_service import DatabaseService

logger = logging.getLogger(__name__)


class Orchestrator:
    """
    Central orchestrator coordinating agent cooperation through a structured AgentContext.
    Executes the 4-phase OODA loop:
    1. Observe: CaptureAgent
    2. Orient: AnalyzerAgent
    3. Decide: PlannerAgent
    4. Act: EvaluatorAgent
    """

    def __init__(self):
        self.capture_agent = CaptureAgent()
        self.analyzer_agent = AnalyzerAgent()
        self.planner_agent = PlannerAgent()
        self.evaluator_agent = EvaluatorAgent()
        self.meta_agent = MetaAgent()

    async def run_expense_cycle(self, context: AgentContext) -> AgentContext:
        """
        Executes the full multi-agent OODA pipeline for an expense event.
        Enriches context sequentially and logs each step for end-to-end observability.
        """
        total_start = time.perf_counter()
        agent_steps: List[AgentResult] = []

        try:
            # 1. Observe (Capture)
            capture_res = await self.capture_agent.execute(context)
            agent_steps.append(capture_res)

            # 2. Orient (Analyzer)
            analyzer_res = await self.analyzer_agent.execute(context)
            agent_steps.append(analyzer_res)

            # 3. Decide (Planner)
            planner_res = await self.planner_agent.execute(context)
            agent_steps.append(planner_res)

            # 4. Act (Evaluator)
            evaluator_res = await self.evaluator_agent.execute(context)
            agent_steps.append(evaluator_res)

            total_duration_ms = int((time.perf_counter() - total_start) * 1000)
            context.metadata["ooda_completed"] = True
            context.metadata["total_duration_ms"] = total_duration_ms
            context.metadata["steps"] = [res.model_dump() for res in agent_steps]

        except Exception as e:
            logger.error(f"Error during OODA cycle for request {context.request_id}: {e}", exc_info=True)
            context.metadata["ooda_completed"] = False
            context.metadata["error"] = str(e)
            await DatabaseService.log_agent_event(
                user_id=context.user_id,
                request_id=context.request_id,
                agent_name="orchestrator",
                event_type="cycle_failed",
                input_data={"request_id": str(context.request_id)},
                output_data={"error": str(e)},
                status="failed",
            )

        return context

    async def run_feedback_cycle(self, context: AgentContext) -> AgentContext:
        """
        Executes the MetaAgent continuous learning cycle upon receiving user feedback.
        """
        await self.meta_agent.execute(context)
        return context


orchestrator = Orchestrator()
