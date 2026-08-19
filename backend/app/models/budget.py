"""
Budget Model entity representation
"""

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID


@dataclass
class BudgetModel:
    id: UUID
    user_id: UUID
    month: date
    amount: Decimal
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
