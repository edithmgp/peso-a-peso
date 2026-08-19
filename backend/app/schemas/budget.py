"""
Budget Schemas based on Technical Contract v1.3
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    month: date = Field(..., description="First day of the budget month (YYYY-MM-01)")
    amount: Decimal = Field(..., ge=0, description="Total budget amount allocated for the month")


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Decimal = Field(..., ge=0)


class BudgetResponse(BudgetBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
