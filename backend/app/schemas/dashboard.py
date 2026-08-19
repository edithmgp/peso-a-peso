"""
Dashboard Schemas based on Technical Contract v1.3
"""

from decimal import Decimal
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from app.schemas.alert import AlertResponse


class BudgetSummary(BaseModel):
    total: Decimal = Field(..., description="Monthly total budget allocated")
    spent: Decimal = Field(..., description="Accumulated spent amount in month")
    remaining: Decimal = Field(..., description="Remaining unspent budget")
    percentage_used: Decimal = Field(..., description="Percentage of total budget consumed")


class ProjectionSummary(BaseModel):
    projected_total: Decimal = Field(..., description="Forecasted monthly total expenditure")
    projected_savings: Decimal = Field(..., description="Estimated savings or surplus")
    status: Literal["on_track", "warning", "over_budget"] = Field(..., description="Financial pacing status")


class DashboardResponse(BaseModel):
    available_today: Decimal = Field(..., description="Calculated deterministic daily spending allowance")
    budget: BudgetSummary = Field(..., description="Current month budget progress")
    projection: ProjectionSummary = Field(..., description="Forecast to end of month")
    alerts: List[AlertResponse] = Field(default_factory=list, description="Active user alerts and recommendations")
