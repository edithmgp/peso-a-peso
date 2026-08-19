"""
Central OODA Orchestrator
"""

from typing import List
from app.agents.base import BaseAgent
from app.agents.capture_agent import CaptureAgent
from app.agents.analyzer_agent import AnalyzerAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.evaluator_agent import EvaluatorAgent
from app.agents.meta_agent import MetaAgent
from app.orchestrator.states import CycleState
from app.schemas.agents import AgentContext, AgentResult


class Orchestrator:
    """
    Central orchestrator coordinating agent execution through structured AgentContext.
    """

    def __init__(self):
        self.capture_agent = CaptureAgent()
        self.analyzer_agent = AnalyzerAgent()
        self.planner_agent = PlannerAgent()
        self.evaluator_agent = EvaluatorAgent()
        self.meta_agent = MetaAgent()

    async def run_expense_cycle(self, context: AgentContext) -> AgentContext:
        """
        Executes the linear OODA pipeline for a newly created or validated expense.
        """
        # 1. Capture/Validation
        capture_res = await self.capture_agent.execute(context)

        # 2. Pattern Analysis
        analyzer_res = await self.analyzer_agent.execute(context)

        # 3. Planning & Projection
        planner_res = await self.planner_agent.execute(context)

        # 4. Evaluation & Alerting
        evaluator_res = await self.evaluator_agent.execute(context)

        return context

    async def run_feedback_cycle(self, context: AgentContext) -> AgentContext:
        """
        Executes the MetaAgent continuous learning cycle upon receiving user feedback.
        """
        await self.meta_agent.execute(context)
        return context


orchestrator = Orchestrator()
