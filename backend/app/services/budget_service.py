"""
Budget Service — CRUD operations for monthly budgets against Supabase.

Business rule: one budget per user per month (enforced by DB unique constraint).
"""

import logging
from datetime import date, datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from app.core.database import get_service_db, get_db
from app.schemas.budget import BudgetCreate, BudgetUpdate

logger = logging.getLogger(__name__)


class BudgetService:
    """Manages user monthly budgets."""

    @staticmethod
    def _get_client():
        return get_service_db() or get_db()

    @staticmethod
    def _current_month_start() -> str:
        """Returns the first day of the current month as ISO string."""
        today = date.today()
        return today.replace(day=1).isoformat()

    @staticmethod
    async def get_current_budget(user_id: UUID) -> Optional[Dict[str, Any]]:
        """Retrieves the budget for the current calendar month."""
        client = BudgetService._get_client()
        month_start = BudgetService._current_month_start()

        if client is None:
            logger.warning("No DB client — returning mock budget.")
            return {
                "id": str(uuid4()),
                "user_id": str(user_id),
                "month": month_start,
                "amount": 600000.0,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

        try:
            response = (
                client.table("budgets")
                .select("*")
                .eq("user_id", str(user_id))
                .eq("month", month_start)
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching current budget: {e}")
            return None

    @staticmethod
    async def create_budget(user_id: UUID, payload: BudgetCreate) -> Optional[Dict[str, Any]]:
        """Creates a budget for the given month. Fails if one already exists (DB constraint)."""
        client = BudgetService._get_client()

        data = {
            "user_id": str(user_id),
            "month": payload.month.isoformat(),
            "amount": float(payload.amount),
        }

        if client is None:
            data["id"] = str(uuid4())
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            return data

        try:
            response = client.table("budgets").insert(data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error creating budget: {e}")
            raise

    @staticmethod
    async def update_budget(
        user_id: UUID, budget_id: UUID, payload: BudgetUpdate
    ) -> Optional[Dict[str, Any]]:
        """Updates the amount of an existing budget."""
        client = BudgetService._get_client()

        if client is None:
            return None

        try:
            response = (
                client.table("budgets")
                .update({"amount": float(payload.amount)})
                .eq("id", str(budget_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating budget {budget_id}: {e}")
            raise

    @staticmethod
    async def get_total_spent_current_month(user_id: UUID) -> float:
        """Returns total confirmed expenses for the current month. Used by financial calculations."""
        client = BudgetService._get_client()
        today = date.today()
        month_start = today.replace(day=1).isoformat()
        month_end = today.isoformat()

        if client is None:
            return 0.0

        try:
            response = (
                client.table("expenses")
                .select("amount")
                .eq("user_id", str(user_id))
                .eq("confirmed", True)
                .gte("expense_date", month_start)
                .lte("expense_date", month_end)
                .execute()
            )
            rows = response.data or []
            return sum(float(r["amount"]) for r in rows)
        except Exception as e:
            logger.error(f"Error summing expenses: {e}")
            return 0.0
