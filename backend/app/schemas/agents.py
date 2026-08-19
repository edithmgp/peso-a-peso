"""
Agent Context and System Schemas based on Technical Contract v1.3
"""

from typing import Any, Dict, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from app.schemas.expense import ExpenseResponse
from app.schemas.analysis import FinancialAnalysis, FinancialProjection


class BehaviorProfile(BaseModel):
    preferred_tone: Literal["neutral", "friendly", "direct"] = "neutral"
    alert_frequency: Literal["low", "normal", "high"] = "normal"
    category_scores: Dict[str, float] = Field(default_factory=dict)


class EvaluationResult(BaseModel):
    should_alert: bool = False
    severity: Literal["info", "warning", "critical"] = "info"
    reason: str = ""
    recommendation: str = ""


class AgentResult(BaseModel):
    agent_name: str
    status: Literal["success", "failed"]
    duration_ms: int
    output: Dict[str, Any] = Field(default_factory=dict)


class AgentContext(BaseModel):
    request_id: UUID
    user_id: UUID
    expense: Optional[ExpenseResponse] = None
    analysis: Optional[FinancialAnalysis] = None
    projection: Optional[FinancialProjection] = None
    evaluation: Optional[EvaluationResult] = None
    user_profile: Optional[BehaviorProfile] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
