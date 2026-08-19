"""
FastAPI Route Dependencies
"""

from typing import Annotated
from uuid import UUID
from fastapi import Depends
from app.core.security import get_current_user_id


async def get_current_user_uuid(user_id_str: str = Depends(get_current_user_id)) -> UUID:
    return UUID(user_id_str)


CurrentUser = Annotated[UUID, Depends(get_current_user_uuid)]
