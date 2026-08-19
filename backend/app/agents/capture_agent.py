"""
Capture & Ingestion Agent
"""

import time
from app.agents.base import BaseAgent
from app.schemas.agents import AgentContext, AgentResult


class CaptureAgent(BaseAgent):
    """
    Transforms raw inputs (text, OCR candidates, manual data) into structured ExpenseCandidate.
    """

    def __init__(self):
        super().__init__(name="capture")

    async def execute(self, context: AgentContext) -> AgentResult:
        start_time = time.perf_counter()
        # Sprint 0 structural placeholder
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        return AgentResult(
            agent_name=self.name,
            status="success",
            duration_ms=duration_ms,
            output={"message": "CaptureAgent initialized (Sprint 0 structural base)"},
        )
