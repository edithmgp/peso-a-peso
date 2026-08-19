"""
Tests for Supabase Auth, Security and Database Service
"""

import pytest
import jwt
from uuid import UUID, uuid4
from fastapi import HTTPException
from app.core.security import get_current_user_id, DEV_FALLBACK_USER_ID
from app.services.db_service import DatabaseService


@pytest.mark.asyncio
async def test_get_current_user_id_dev_fallback():
    user_id = await get_current_user_id(authorization=None, x_user_id=None)
    assert user_id == DEV_FALLBACK_USER_ID
    assert UUID(user_id)


@pytest.mark.asyncio
async def test_get_current_user_id_with_x_user_id():
    custom_uuid = str(uuid4())
    user_id = await get_current_user_id(authorization=None, x_user_id=custom_uuid)
    assert user_id == custom_uuid


@pytest.mark.asyncio
async def test_get_current_user_id_invalid_x_user_id():
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(authorization=None, x_user_id="invalid-uuid")
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_current_user_id_with_jwt():
    target_uuid = str(uuid4())
    fake_jwt = jwt.encode({"sub": target_uuid}, "secret", algorithm="HS256")
    user_id = await get_current_user_id(authorization=f"Bearer {fake_jwt}", x_user_id=None)
    assert user_id == target_uuid


@pytest.mark.asyncio
async def test_database_service_categories_fallback():
    categories = await DatabaseService.get_categories()
    assert len(categories) >= 8
    assert any(c["slug"] == "food" for c in categories)


@pytest.mark.asyncio
async def test_database_service_log_agent_event():
    success = await DatabaseService.log_agent_event(
        user_id=uuid4(),
        request_id=uuid4(),
        agent_name="analyzer",
        event_type="test_event",
        duration_ms=15,
    )
    assert success is True
