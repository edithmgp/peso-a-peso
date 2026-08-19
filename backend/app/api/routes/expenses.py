"""
Expenses Endpoints (/api/v1/expenses)
Connected to ExpenseService with real Supabase persistence.
"""

from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status
from app.api.dependencies import CurrentUser
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, user_id: CurrentUser):
    """
    Creates a new expense and persists it to Supabase.
    Manual expenses are auto-confirmed. OCR expenses require a separate confirmation step.
    Sprint 4 will trigger the full OODA orchestration cycle after creation.
    """
    result = await ExpenseService.create_expense(user_id, payload)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create expense.",
        )
    return result


@router.get("", response_model=List[ExpenseResponse])
async def list_expenses(
    user_id: CurrentUser,
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    category_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """
    Lists expenses for the authenticated user.
    Supports filtering by date range and category.
    """
    return await ExpenseService.get_expenses(
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
        category_id=category_id,
        limit=limit,
        offset=offset,
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: UUID, user_id: CurrentUser):
    """
    Retrieves a single expense by ID.
    Returns 404 if the expense does not exist OR belongs to another user (security: no 403 leak).
    """
    result = await ExpenseService.get_expense_by_id(user_id, expense_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    return result


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: UUID, payload: ExpenseUpdate, user_id: CurrentUser):
    """
    Updates mutable fields of an expense (amount, category, description, merchant, date).
    user_id and created_at are immutable.
    """
    result = await ExpenseService.update_expense(user_id, expense_id, payload)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    return result


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: UUID, user_id: CurrentUser):
    """Permanently deletes an expense. Returns 404 if not found or not owned by user."""
    deleted = await ExpenseService.delete_expense(user_id, expense_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    return None
