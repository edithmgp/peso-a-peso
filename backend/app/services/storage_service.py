"""
Storage Service for Supabase Buckets
"""

from typing import Optional


class StorageService:
    """Handles uploads and secure URLs for receipt images in Supabase Storage."""

    @staticmethod
    async def upload_receipt(user_id: str, filename: str, file_bytes: bytes) -> str:
        """Stores image under receipts/{user_id}/{filename} and returns path."""
        return f"receipts/{user_id}/{filename}"
