"""
Expense Schemas based on Technical Contract v1.3
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Expense amount in currency unit")
    description: Optional[str] = Field(None, description="Detailed description of consumption")
    merchant: Optional[str] = Field(None, description="Merchant or vendor name")
    expense_date: date = Field(..., description="Date when expense occurred")
    category_id: UUID = Field(..., description="UUID of associated category")


class ExpenseCreate(ExpenseBase):
    source: Literal["manual", "text", "ocr"] = "manual"


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0)
    description: Optional[str] = None
    merchant: Optional[str] = None
    expense_date: Optional[date] = None
    category_id: Optional[UUID] = None


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    source: Literal["manual", "text", "ocr"]
    confidence: Optional[Decimal] = None
    confirmed: bool
    receipt_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReceiptCandidate(BaseModel):
    amount: Optional[Decimal] = None
    merchant: Optional[str] = None
    expense_date: Optional[date] = None
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    confidence: Decimal = Field(..., ge=0, le=1)
    receipt_path: str


class ReceiptConfirm(BaseModel):
    candidate: ReceiptCandidate
    confirmed: bool
