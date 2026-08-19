"""
AI Service (Google Gemini Integration wrapper)
"""

from typing import Optional
from app.core.config import settings


class AIService:
    """Wrapper for Google Gemini 2.0 Flash / Vision operations."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL

    async def parse_natural_language_expense(self, text: str) -> dict:
        """Parses natural language string into expense attributes."""
        # Sprint 0 placeholder
        return {
            "amount": None,
            "merchant": None,
            "category": "other",
            "confidence": 0.0,
        }

    async def extract_receipt_data(self, image_bytes: bytes) -> dict:
        """Processes receipt photo through Gemini Vision."""
        # Sprint 0 placeholder
        return {
            "amount": None,
            "merchant": None,
            "date": None,
            "category": "other",
            "confidence": 0.0,
        }
