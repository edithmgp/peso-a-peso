"""
Category Service — Reads shared categories from Supabase.
Categories are global (no user_id). All authenticated users can read them.
"""

import logging
from typing import Any, Dict, List
from app.core.database import get_service_db, get_db

logger = logging.getLogger(__name__)

# Static fallback when Supabase is not configured (development without .env)
_FALLBACK_CATEGORIES: List[Dict[str, Any]] = [
    {"id": "c0000000-0000-0000-0000-000000000001", "name": "Comida", "slug": "food"},
    {"id": "c0000000-0000-0000-0000-000000000002", "name": "Servicios", "slug": "utilities"},
    {"id": "c0000000-0000-0000-0000-000000000003", "name": "Transporte", "slug": "transport"},
    {"id": "c0000000-0000-0000-0000-000000000004", "name": "Ocio", "slug": "leisure"},
    {"id": "c0000000-0000-0000-0000-000000000005", "name": "Vivienda", "slug": "housing"},
    {"id": "c0000000-0000-0000-0000-000000000006", "name": "Salud", "slug": "health"},
    {"id": "c0000000-0000-0000-0000-000000000007", "name": "Educación", "slug": "education"},
    {"id": "c0000000-0000-0000-0000-000000000008", "name": "Otros", "slug": "other"},
]


class CategoryService:
    """Handles read access to the categories table."""

    @staticmethod
    async def get_all() -> List[Dict[str, Any]]:
        """Fetches all predefined categories from Supabase."""
        client = get_service_db() or get_db()
        if client is None:
            logger.info("Supabase not configured — returning fallback categories.")
            return _FALLBACK_CATEGORIES
        try:
            response = client.table("categories").select("id, name, slug").order("name").execute()
            return response.data or _FALLBACK_CATEGORIES
        except Exception as e:
            logger.error(f"Error querying categories: {e}")
            return _FALLBACK_CATEGORIES
