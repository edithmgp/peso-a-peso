"""
Financial Analysis and Projection Schemas based on Technical Contract v1.3
"""

from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field


class FinancialAnalysis(BaseModel):
    daily_average: Decimal = Field(..., description="Average daily spending in current period")
    category_average: Decimal = Field(..., description="Historical average spending in category")
    category_deviation: Decimal = Field(..., description="Standard deviation from category norm")
    spending_velocity: Decimal = Field(..., description="Current rate of spending vs budget timeline")
    anomaly_detected: bool = Field(..., description="Flag indicating if consumption is anomalous")
    anomaly_score: Decimal = Field(..., description="Statistical confidence score for anomaly")
    risk_level: Literal["low", "medium", "high"] = Field(..., description="Assessed risk level")


class FinancialProjection(BaseModel):
    remaining_budget: Decimal = Field(..., description="Total unspent budget amount")
    remaining_days: int = Field(..., ge=0, description="Days remaining until end of current month")
    available_per_day: Decimal = Field(..., description="Deterministic free money available per day")
    projected_monthly_spending: Decimal = Field(..., description="Projected total spend at month end")
    projected_savings: Decimal = Field(..., description="Projected savings relative to initial budget")
    budget_risk: Literal["low", "medium", "high"] = Field(..., description="Overall risk of budget overrun")
