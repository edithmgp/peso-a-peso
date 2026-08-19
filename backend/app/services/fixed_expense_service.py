"""
Fixed Expense Service — CRUD for recurring fixed expenses (rent, utilities, etc.).

Fixed expenses are used by the Planner Agent to calculate real available budget
after subtracting upcoming high-priority fixed costs.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.core.database import get_service_db, get_db
from app.schemas.fixed_expense import FixedExpenseCreate, FixedExpenseUpdate

logger = logging.getLogger(__name__)


class FixedExpenseService:
    """Manages user fixed/recurring expenses."""

    @staticmethod
    def _get_client():
        return get_service_db() or get_db()

    @staticmethod
    async def list_fixed_expenses(
        user_id: UUID, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Lists fixed expenses for a user, optionally filtering by active status."""
        client = FixedExpenseService._get_client()

        if client is None:
            logger.warning("No DB client — returning empty fixed expenses list.")
            return []

        try:
            query = (
                client.table("fixed_expenses")
                .select("*, categories(id, name, slug)")
                .eq("user_id", str(user_id))
                .order("due_day")
            )
            if active_only:
                query = query.eq("active", True)

            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error listing fixed expenses: {e}")
            return []

    @staticmethod
    async def create_fixed_expense(
        user_id: UUID, payload: FixedExpenseCreate
    ) -> Optional[Dict[str, Any]]:
        """Creates a new fixed expense record."""
        client = FixedExpenseService._get_client()

        data = {
            "user_id": str(user_id),
            "category_id": str(payload.category_id),
            "name": payload.name,
            "expected_amount": float(payload.expected_amount),
            "due_day": payload.due_day,
            "priority": payload.priority,
            "active": True,
        }

        if client is None:
            data["id"] = str(uuid4())
            data["created_at"] = datetime.utcnow().isoformat()
            data["updated_at"] = datetime.utcnow().isoformat()
            return data

        try:
            response = client.table("fixed_expenses").insert(data).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error creating fixed expense: {e}")
            raise

    @staticmethod
    async def update_fixed_expense(
        user_id: UUID, fixed_expense_id: UUID, payload: FixedExpenseUpdate
    ) -> Optional[Dict[str, Any]]:
        """Updates a fixed expense. Supports partial updates (only provided fields)."""
        client = FixedExpenseService._get_client()

        if client is None:
            return None

        update_data: Dict[str, Any] = {}
        if payload.name is not None:
            update_data["name"] = payload.name
        if payload.category_id is not None:
            update_data["category_id"] = str(payload.category_id)
        if payload.expected_amount is not None:
            update_data["expected_amount"] = float(payload.expected_amount)
        if payload.due_day is not None:
            update_data["due_day"] = payload.due_day
        if payload.priority is not None:
            update_data["priority"] = payload.priority
        if payload.active is not None:
            update_data["active"] = payload.active

        if not update_data:
            return await FixedExpenseService.get_by_id(user_id, fixed_expense_id)

        try:
            response = (
                client.table("fixed_expenses")
                .update(update_data)
                .eq("id", str(fixed_expense_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating fixed expense {fixed_expense_id}: {e}")
            raise

    @staticmethod
    async def delete_fixed_expense(user_id: UUID, fixed_expense_id: UUID) -> bool:
        """Deletes a fixed expense permanently."""
        client = FixedExpenseService._get_client()

        if client is None:
            return True

        try:
            response = (
                client.table("fixed_expenses")
                .delete()
                .eq("id", str(fixed_expense_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error deleting fixed expense {fixed_expense_id}: {e}")
            raise

    @staticmethod
    async def get_by_id(
        user_id: UUID, fixed_expense_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Fetches a single fixed expense by ID."""
        client = FixedExpenseService._get_client()
        if client is None:
            return None
        try:
            response = (
                client.table("fixed_expenses")
                .select("*, categories(id, name, slug)")
                .eq("id", str(fixed_expense_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching fixed expense {fixed_expense_id}: {e}")
            return None

    @staticmethod
    async def get_total_pending_high_priority(user_id: UUID, from_day: int) -> float:
        """
        Returns the sum of active high-priority fixed expenses due after `from_day`.
        Used by Planner Agent to calculate truly available budget.
        Rule: high-priority fixed costs are subtracted before calculating daily available.
        """
        client = FixedExpenseService._get_client()
        if client is None:
            return 0.0

        try:
            response = (
                client.table("fixed_expenses")
                .select("expected_amount")
                .eq("user_id", str(user_id))
                .eq("active", True)
                .eq("priority", "high")
                .gte("due_day", from_day)
                .execute()
            )
            rows = response.data or []
            return sum(float(r["expected_amount"]) for r in rows)
        except Exception as e:
            logger.error(f"Error computing high-priority fixed total: {e}")
            return 0.0
