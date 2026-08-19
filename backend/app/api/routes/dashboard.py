"""
Dashboard Endpoints (/api/v1/dashboard)
Connected to FinancialService for deterministic financial calculations.
"""

from fastapi import APIRouter
from app.api.dependencies import CurrentUser
from app.schemas.dashboard import DashboardResponse, DashboardChartsResponse
from app.services.financial_service import FinancialService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(user_id: CurrentUser):
    """
    Returns consolidated dashboard metrics calculated deterministically on server:
    - Available Today: remaining budget minus upcoming high-priority fixed expenses, divided by remaining days.
    - Budget Summary: total, spent, remaining, percentage used.
    - Projection: forecast at month end, projected savings, pacing status (on_track, warning, over_budget).
    - Alerts: active warnings and advice.
    """
    metrics = await FinancialService.calculate_monthly_metrics(user_id)
    return metrics


@router.get("/charts", response_model=DashboardChartsResponse)
async def get_dashboard_charts(user_id: CurrentUser):
    """
    Returns aggregated chart series for Recharts visualizations:
    - Categories: spending breakdown by category for the current month.
    - Timeline: day-by-day accumulated spending vs ideal linear budget curve.
    """
    categories = await FinancialService.get_category_spending_breakdown(user_id)
    timeline = await FinancialService.get_daily_spending_timeline(user_id)
    return {
        "categories": categories,
        "timeline": timeline,
    }
