"""
Dashboard Endpoints (/api/v1/dashboard)
"""

from decimal import Decimal
from fastapi import APIRouter
from app.api.dependencies import CurrentUser
from app.schemas.dashboard import DashboardResponse, BudgetSummary, ProjectionSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(user_id: CurrentUser):
    """
    Returns dashboard consolidated data (deterministic calculations already done on server).
    """
    return DashboardResponse(
        available_today=Decimal("18500.00"),
        budget=BudgetSummary(
            total=Decimal("600000.00"),
            spent=Decimal("420000.00"),
            remaining=Decimal("180000.00"),
            percentage_used=Decimal("70.00"),
        ),
        projection=ProjectionSummary(
            projected_total=Decimal("575000.00"),
            projected_savings=Decimal("25000.00"),
            status="on_track",
        ),
        alerts=[],
    )
