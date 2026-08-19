"""
Fixed Expense Schemas based on Technical Contract v1.3 (Doc 2.estructura-DB.md §10)
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class FixedExpenseBase(BaseModel):
    name: str = Field(..., description="Name of the fixed expense (e.g. 'Luz', 'Alquiler')")
    category_id: UUID = Field(..., description="UUID of associated category")
    expected_amount: Decimal = Field(..., ge=0, description="Expected monthly amount")
    due_day: int = Field(..., ge=1, le=31, description="Day of month when payment is due")
    priority: Literal["low", "normal", "high"] = Field(
        "normal", description="Payment priority for budget calculation"
    )


class FixedExpenseCreate(FixedExpenseBase):
    pass


class FixedExpenseUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    expected_amount: Optional[Decimal] = Field(None, ge=0)
    due_day: Optional[int] = Field(None, ge=1, le=31)
    priority: Optional[Literal["low", "normal", "high"]] = None
    active: Optional[bool] = None


class FixedExpenseResponse(FixedExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    active: bool
    created_at: datetime
    updated_at: datetime
