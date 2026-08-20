"""
Profile and Persistent User Memory Schemas based on Technical Contract v1.3
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ProfileBase(BaseModel):
    full_name: Optional[str] = Field(None, description="User full name")
    currency: str = Field("ARS", description="ISO currency code")
    monthly_income: Optional[Decimal] = Field(None, ge=0, description="Monthly income baseline")
    payday: Optional[int] = Field(None, ge=1, le=31, description="Day of month when salary is received")
    preferred_tone: Literal["neutral", "friendly", "direct"] = Field(
        "neutral", description="Preferred AI agent communication tone"
    )
    alert_frequency: Literal["low", "normal", "high"] = Field(
        "normal", description="Global alert dispatch frequency"
    )
    category_scores: Dict[str, float] = Field(
        default_factory=dict,
        description="Dynamic category sensitivity weights learned by MetaAgent (0.0 to 2.0)",
    )


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None
    monthly_income: Optional[Decimal] = Field(None, ge=0)
    payday: Optional[int] = Field(None, ge=1, le=31)
    preferred_tone: Optional[Literal["neutral", "friendly", "direct"]] = None
    alert_frequency: Optional[Literal["low", "normal", "high"]] = None
    category_scores: Optional[Dict[str, float]] = None


class ProfileResponse(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
