"""
Supabase Client & Database Connection Setup
"""

import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages Supabase client instances for standard and service role operations."""
    _client: Optional[Client] = None
    _service_client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Optional[Client]:
        """Returns standard Supabase client (using anon key)."""
        if cls._client is None:
            try:
                if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY and not settings.SUPABASE_URL.startswith("https://placeholder"):
                    cls._client = create_client(
                        settings.SUPABASE_URL,
                        settings.SUPABASE_ANON_KEY,
                    )
                    logger.info("Supabase anon client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Supabase anon client: {e}")
                cls._client = None
        return cls._client

    @classmethod
    def get_service_client(cls) -> Optional[Client]:
        """Returns elevated Supabase client (using service role key)."""
        if cls._service_client is None:
            try:
                if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and not settings.SUPABASE_URL.startswith("https://placeholder"):
                    cls._service_client = create_client(
                        settings.SUPABASE_URL,
                        settings.SUPABASE_SERVICE_ROLE_KEY,
                    )
                    logger.info("Supabase service role client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Supabase service role client: {e}")
                cls._service_client = None
        return cls._service_client


def get_db() -> Optional[Client]:
    """Dependency provider for general database queries."""
    return DatabaseManager.get_client()


def get_service_db() -> Optional[Client]:
    """Dependency provider for privileged/backend-only database queries."""
    return DatabaseManager.get_service_client()
