"""
Expense Model entity representation
"""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID


@dataclass
class ExpenseModel:
    id: UUID
    user_id: UUID
    category_id: UUID
    amount: Decimal
    expense_date: date
    source: str = "manual"
    description: Optional[str] = None
    merchant: Optional[str] = None
    confidence: Optional[Decimal] = None
    confirmed: bool = True
    receipt_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
