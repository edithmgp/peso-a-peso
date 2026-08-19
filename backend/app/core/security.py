"""
Security, Authentication and Token Verification
"""

from typing import Optional
from fastapi import Header, HTTPException, status


async def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
) -> str:
    """
    Extracts authenticated user ID from Authorization Bearer token or development header.
    In production with Supabase Auth, this will validate the JWT token.
    """
    if x_user_id:
        return x_user_id

    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "").strip()
        if token:
            # Placeholder for JWT validation during Sprint 0
            return "00000000-0000-0000-0000-000000000001"

    # Default fallback for initial development testing without business logic
    return "00000000-0000-0000-0000-000000000001"
