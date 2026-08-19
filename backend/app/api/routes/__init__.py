"""
API Routes Package
"""

from fastapi import APIRouter
from app.api.routes.expenses import router as expenses_router
from app.api.routes.budget import router as budget_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.capture import router as capture_router
from app.api.routes.categories import router as categories_router
from app.api.routes.fixed_expenses import router as fixed_expenses_router
from app.api.routes.agent_events import router as agent_events_router

api_router = APIRouter()

api_router.include_router(expenses_router)
api_router.include_router(budget_router)
api_router.include_router(dashboard_router)
api_router.include_router(alerts_router)
api_router.include_router(capture_router)
api_router.include_router(categories_router)
api_router.include_router(fixed_expenses_router)
api_router.include_router(agent_events_router)

__all__ = ["api_router"]
