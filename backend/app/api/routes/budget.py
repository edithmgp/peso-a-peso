"""
Budget Endpoints (/api/v1/budget)
Connected to BudgetService with real Supabase persistence.
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from app.api.dependencies import CurrentUser
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budget", tags=["Budget"])


@router.get("/current", response_model=BudgetResponse)
async def get_current_budget(user_id: CurrentUser):
    """
    Retrieves the budget for the current calendar month.
    Returns 404 if no budget has been set for this month yet.
    """
    result = await BudgetService.get_current_budget(user_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No budget configured for the current month.",
        )
    return result


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(payload: BudgetCreate, user_id: CurrentUser):
    """
    Creates a budget for a given month.
    Returns 409 if a budget already exists for that month (one budget per month per user).
    """
    try:
        result = await BudgetService.create_budget(user_id, payload)
    except Exception as e:
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg or "23505" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A budget already exists for that month. Use PUT to update it.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create budget.",
        )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create budget.",
        )
    return result


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: UUID, payload: BudgetUpdate, user_id: CurrentUser):
    """Updates the amount of an existing budget."""
    result = await BudgetService.update_budget(user_id, budget_id, payload)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")
    return result
