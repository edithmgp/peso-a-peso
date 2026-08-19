"""
Supabase Client & Database Connection Setup
"""

from typing import Optional
from app.core.config import settings

# In later sprints, supabase-py client is initialized here.
# During Sprint 0, we provide a placeholder connection client wrapper.

class DatabaseManager:
    """Manages Supabase client instances."""
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            try:
                from supabase import create_client, Client
                if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
                    cls._client = create_client(
                        settings.SUPABASE_URL,
                        settings.SUPABASE_SERVICE_ROLE_KEY
                    )
            except Exception:
                cls._client = None
        return cls._client


def get_db():
    """Dependency provider for database operations."""
    return DatabaseManager.get_client()
