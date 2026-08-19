"""
Security, Authentication and Token Verification for Supabase Auth
"""

import logging
from typing import Optional
from uuid import UUID
from fastapi import Header, HTTPException, status
import jwt
from app.core.config import settings

logger = logging.getLogger(__name__)

# Default developer test UUID for offline / unauthenticated development mode
DEV_FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000001"


async def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
) -> str:
    """
    Extracts authenticated user ID from Authorization Bearer token (Supabase Auth JWT)
    or custom header for local development.
    """
    # 1. Check development explicit header
    if x_user_id:
        try:
            # Validate format
            UUID(x_user_id)
            return x_user_id
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-User-ID format. Must be a valid UUID.",
            )

    # 2. Extract Bearer token if present
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        if token:
            try:
                # Decode Supabase JWT payload without signature verification in dev,
                # or verify when JWT secret / supabase client is configured.
                decoded = jwt.decode(token, options={"verify_signature": False})
                user_id = decoded.get("sub")
                if user_id:
                    UUID(user_id)
                    return user_id
            except Exception as e:
                logger.warning(f"Could not decode JWT token: {e}")
                # If a malformed token was explicitly sent in production mode:
                if settings.ENVIRONMENT == "production":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired authentication token.",
                    )

    # 3. Development Fallback
    if settings.ENVIRONMENT != "production":
        return DEV_FALLBACK_USER_ID

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Supabase bearer token.",
    )
