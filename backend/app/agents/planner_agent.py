"""
Planner & Forecaster Agent
"""

import time
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult


class PlannerAgent(BaseAgent):
    """
    Answers 'Will I make it to the end of the month?' and calculates daily free money.
    """

    def __init__(self):
        super().__init__(name="planner")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()
        # Sprint 0 structural placeholder
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        return AgentResult(
            agent_name=self.name,
            status="success",
            duration_ms=duration_ms,
            output={"message": "PlannerAgent initialized (Sprint 0 structural base)"},
        )
