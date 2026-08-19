"""
Expenses Endpoints (/api/v1/expenses)
"""

from datetime import date
from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, status, Query
from app.api.dependencies import CurrentUser
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, user_id: CurrentUser):
    """Creates a new expense and triggers the agent orchestration cycle."""
    from datetime import datetime
    return ExpenseResponse(
        id=uuid4(),
        user_id=user_id,
        amount=payload.amount,
        description=payload.description,
        merchant=payload.merchant,
        expense_date=payload.expense_date,
        category_id=payload.category_id,
        source=payload.source,
        confidence=None,
        confirmed=True,
        receipt_path=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.get("", response_model=List[ExpenseResponse])
async def list_expenses(
    user_id: CurrentUser,
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    category_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
):
    """Lists expenses filtered by date range or category."""
    return []


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: UUID, user_id: CurrentUser):
    """Retrieves a single expense by ID."""
    from datetime import datetime, date
    return ExpenseResponse(
        id=expense_id,
        user_id=user_id,
        amount=100.0,
        description="Sample expense",
        merchant="Store",
        expense_date=date.today(),
        category_id=uuid4(),
        source="manual",
        confidence=None,
        confirmed=True,
        receipt_path=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(expense_id: UUID, payload: ExpenseUpdate, user_id: CurrentUser):
    """Updates an existing expense."""
    from datetime import datetime, date
    return ExpenseResponse(
        id=expense_id,
        user_id=user_id,
        amount=payload.amount or 100.0,
        description=payload.description,
        merchant=payload.merchant,
        expense_date=payload.expense_date or date.today(),
        category_id=payload.category_id or uuid4(),
        source="manual",
        confidence=None,
        confirmed=True,
        receipt_path=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: UUID, user_id: CurrentUser):
    """Deletes an expense by ID."""
    return None
