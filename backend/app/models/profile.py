"""
User Profile Model entity representation
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID


@dataclass
class ProfileModel:
    id: UUID
    currency: str = "ARS"
    full_name: Optional[str] = None
    monthly_income: Optional[Decimal] = None
    payday: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
