"""
Budget Endpoints (/api/v1/budget)
"""

from datetime import date, datetime
from uuid import UUID, uuid4
from fastapi import APIRouter, status
from app.api.dependencies import CurrentUser
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse

router = APIRouter(prefix="/budget", tags=["Budget"])


@router.get("/current", response_model=BudgetResponse)
async def get_current_budget(user_id: CurrentUser):
    """Retrieves current active month budget."""
    today = date.today()
    first_day = today.replace(day=1)
    return BudgetResponse(
        id=uuid4(),
        user_id=user_id,
        month=first_day,
        amount=600000.0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(payload: BudgetCreate, user_id: CurrentUser):
    """Creates a budget for a given month."""
    return BudgetResponse(
        id=uuid4(),
        user_id=user_id,
        month=payload.month,
        amount=payload.amount,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: UUID, payload: BudgetUpdate, user_id: CurrentUser):
    """Updates the amount of a budget."""
    today = date.today()
    return BudgetResponse(
        id=budget_id,
        user_id=user_id,
        month=today.replace(day=1),
        amount=payload.amount,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
