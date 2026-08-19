"""
Base Agent Interface Definition
"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from app.schemas.agents import AgentContext, AgentResult


class BaseAgent(ABC):
    """Abstract base class for all Peso a Peso specialized agents."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def execute(self, context: AgentContext) -> AgentResult:
        """
        Executes agent responsibility using the shared AgentContext.
        Returns an AgentResult with status, duration, and updated context elements.
        """
        pass
