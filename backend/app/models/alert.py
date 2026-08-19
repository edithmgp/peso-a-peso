"""
Alert Model entity representation
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID


@dataclass
class AlertModel:
    id: UUID
    user_id: UUID
    type: str
    severity: str
    title: str
    message: str
    agent_source: str
    category_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    seen_at: Optional[datetime] = None
