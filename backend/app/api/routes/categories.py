"""
Categories Endpoint (/api/v1/categories)
Returns all available expense categories. Read-only for all authenticated users.
"""

from typing import Any, Dict, List
from fastapi import APIRouter
from app.api.dependencies import CurrentUser
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_categories(user_id: CurrentUser):
    """
    Returns all available expense categories.
    Categories are shared across all users and cannot be modified in the MVP.
    """
    return await CategoryService.get_all()
