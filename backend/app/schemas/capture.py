"""
Schemas for Intelligent Ingestion & Gemini Capture based on Technical Contract v1.3
"""

from datetime import date
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class TextCaptureRequest(BaseModel):
    text: str = Field(..., min_length=2, description="Natural language description of the expense")


class CandidateConfirmRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Confirmed expense amount")
    category_id: UUID = Field(..., description="Confirmed category UUID")
    expense_date: date = Field(..., description="Confirmed date of expense")
    merchant: Optional[str] = Field(None, description="Confirmed merchant name")
    description: Optional[str] = Field(None, description="Confirmed description")
    source: Literal["text", "ocr"] = Field("text", description="Ingestion source type")
    confidence: Optional[Decimal] = Field(None, ge=0, le=1, description="AI extraction confidence score")
    receipt_path: Optional[str] = Field(None, description="Path to stored receipt image if OCR")
