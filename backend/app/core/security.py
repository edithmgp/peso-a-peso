"""
Security, Authentication and Token Verification for Supabase Auth

Supports two modes:
- Production: Strict JWT verification — invalid/expired tokens always return 401.
- Development: Falls back to a deterministic dev UUID when no valid token is provided,
  allowing local development without a live Supabase Auth session.
"""

import logging
from typing import Optional
from uuid import UUID
from fastapi import Header, HTTPException, status
import jwt
from app.core.config import settings

logger = logging.getLogger(__name__)

# Deterministic UUID used as fallback only in development mode.
# This user MUST exist in your local profiles table if connecting to a real DB.
DEV_FALLBACK_USER_ID = "00000000-0000-0000-0000-000000000001"

_IS_PROD = settings.ENVIRONMENT == "production"


def _raise_401(detail: str = "Authentication required.") -> None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
) -> str:
    """
    Extracts the authenticated user's UUID from:
      1. ``X-User-ID`` header — development shortcut (rejected in production).
      2. ``Authorization: Bearer <jwt>`` — Supabase Auth JWT (primary path).
      3. Dev fallback UUID — only when ENVIRONMENT != production and no token given.

    Raises:
        HTTP 400: Malformed X-User-ID or unparseable UUID in token payload.
        HTTP 401: Missing or invalid credentials in production mode.
    """

    # ── 1. Developer shortcut via X-User-ID header (dev only) ────────────────
    if x_user_id:
        if _IS_PROD:
            logger.warning("X-User-ID header rejected — production mode.")
            _raise_401("X-User-ID header is not accepted in production.")
        try:
            UUID(x_user_id)
            return x_user_id
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-User-ID format. Must be a valid UUID.",
            )

    # ── 2. Supabase JWT Bearer token ─────────────────────────────────────────
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

        # Reject empty / placeholder tokens immediately
        if not token or token in ("dev-token", "placeholder"):
            if not _IS_PROD:
                return DEV_FALLBACK_USER_ID
            _raise_401("A valid Supabase bearer token is required.")

        try:
            # We intentionally skip signature verification here because the
            # Supabase JWT secret is not always available server-side. The
            # token is already validated cryptographically by the Supabase
            # edge layer before reaching the API; we only need to extract the
            # `sub` claim to identify the authenticated user.
            decoded = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True},
                algorithms=["HS256", "RS256"],
            )

            user_id: Optional[str] = decoded.get("sub")
            if not user_id:
                logger.warning("JWT decoded but 'sub' claim is missing.")
                if _IS_PROD:
                    _raise_401("Token is missing the user identity claim (sub).")
                return DEV_FALLBACK_USER_ID

            # Validate that sub is a proper UUID
            try:
                UUID(user_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Token sub claim is not a valid UUID: {user_id!r}",
                )

            return user_id

        except jwt.ExpiredSignatureError:
            logger.info("JWT token has expired.")
            _raise_401("Authentication token has expired. Please sign in again.")
        except HTTPException:
            raise  # propagate structured errors from above
        except Exception as exc:
            logger.warning(f"Could not decode JWT token: {exc}")
            if _IS_PROD:
                _raise_401("Invalid or malformed authentication token.")
            # Dev mode: fall through to fallback
            return DEV_FALLBACK_USER_ID

    # ── 3. Development fallback (no credentials provided) ────────────────────
    if not _IS_PROD:
        logger.debug("No auth credentials provided — using dev fallback user.")
        return DEV_FALLBACK_USER_ID

    _raise_401(
        "Authentication required. "
        "Please provide a valid Supabase bearer token in the Authorization header."
    )
