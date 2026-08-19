"""
Alert and Feedback Schemas based on Technical Contract v1.3
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    severity: Literal["info", "warning", "critical"]
    title: str
    message: str
    category_id: Optional[UUID] = None
    agent_source: str
    created_at: datetime
    seen_at: Optional[datetime] = None


class AlertFeedbackCreate(BaseModel):
    feedback: Literal["useful", "not_useful"]
