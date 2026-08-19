"""
Fixed Expenses Endpoints (/api/v1/fixed-expenses)
Manages recurring fixed costs like rent, utilities, subscriptions.
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from app.api.dependencies import CurrentUser
from app.schemas.fixed_expense import (
    FixedExpenseCreate,
    FixedExpenseUpdate,
    FixedExpenseResponse,
)
from app.services.fixed_expense_service import FixedExpenseService

router = APIRouter(prefix="/fixed-expenses", tags=["Fixed Expenses"])


@router.get("", response_model=List[FixedExpenseResponse])
async def list_fixed_expenses(
    user_id: CurrentUser,
    active_only: bool = Query(True, description="If true, returns only active fixed expenses"),
):
    """Lists all fixed expenses for the authenticated user."""
    return await FixedExpenseService.list_fixed_expenses(user_id, active_only=active_only)


@router.post("", response_model=FixedExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_fixed_expense(payload: FixedExpenseCreate, user_id: CurrentUser):
    """Creates a new fixed expense (e.g. rent, electricity, streaming subscription)."""
    result = await FixedExpenseService.create_fixed_expense(user_id, payload)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create fixed expense.",
        )
    return result


@router.put("/{fixed_expense_id}", response_model=FixedExpenseResponse)
async def update_fixed_expense(
    fixed_expense_id: UUID, payload: FixedExpenseUpdate, user_id: CurrentUser
):
    """
    Updates a fixed expense. Supports partial updates.
    Use `active: false` to deactivate without deleting.
    """
    result = await FixedExpenseService.update_fixed_expense(user_id, fixed_expense_id, payload)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fixed expense not found."
        )
    return result


@router.delete("/{fixed_expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fixed_expense(fixed_expense_id: UUID, user_id: CurrentUser):
    """Permanently deletes a fixed expense."""
    deleted = await FixedExpenseService.delete_fixed_expense(user_id, fixed_expense_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Fixed expense not found."
        )
    return None
