"""
Orchestrator Context utilities
"""

from uuid import UUID, uuid4
from app.schemas.agents import AgentContext


def create_agent_context(user_id: UUID, request_id: UUID | None = None) -> AgentContext:
    """Factory helper to create a clean, initialized AgentContext for a request cycle."""
    return AgentContext(
        request_id=request_id or uuid4(),
        user_id=user_id,
    )
