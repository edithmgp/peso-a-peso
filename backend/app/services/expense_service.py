"""
Expense Business Service — CRUD operations against Supabase.

Uses service_role client for writes to bypass RLS, but always filters
explicitly by user_id for double-layer isolation (code + RLS).
"""

import logging
from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.core.database import get_service_db, get_db
from app.schemas.expense import ExpenseCreate, ExpenseUpdate

logger = logging.getLogger(__name__)


class ExpenseService:
    """Handles CRUD operations for user expenses against Supabase PostgreSQL."""

    @staticmethod
    def _get_client():
        """Returns service client if available, falls back to anon client."""
        return get_service_db() or get_db()

    @staticmethod
    async def create_expense(user_id: UUID, payload: ExpenseCreate) -> Optional[Dict[str, Any]]:
        """Inserts a new expense for the given user. Returns the created record."""
        client = ExpenseService._get_client()

        data = {
            "user_id": str(user_id),
            "category_id": str(payload.category_id),
            "amount": float(payload.amount),
            "description": payload.description,
            "merchant": payload.merchant,
            "expense_date": payload.expense_date.isoformat(),
            "source": payload.source,
            # Manual entries are always confirmed; OCR entries require separate confirmation
            "confirmed": payload.source == "manual",
            "confidence": None,
            "receipt_path": None,
        }

        if client is None:
            logger.warning("No DB client — returning mock expense.")
            data["id"] = str(uuid4())
            data["created_at"] = "2026-08-18T00:00:00+00:00"
            data["updated_at"] = "2026-08-18T00:00:00+00:00"
            return data

        try:
            response = (
                client.table("expenses")
                .insert(data)
                .execute()
            )
            if response.data:
                return response.data[0]
            logger.error("Insert returned no data.")
            return None
        except Exception as e:
            logger.error(f"Error creating expense: {e}")
            raise

    @staticmethod
    async def get_expenses(
        user_id: UUID,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        category_id: Optional[UUID] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Lists expenses for the user with optional filters."""
        client = ExpenseService._get_client()

        if client is None:
            logger.warning("No DB client — returning empty expense list.")
            return []

        try:
            query = (
                client.table("expenses")
                .select("*, categories(id, name, slug)")
                .eq("user_id", str(user_id))
                .order("expense_date", desc=True)
                .limit(limit)
                .offset(offset)
            )

            if from_date:
                query = query.gte("expense_date", from_date.isoformat())
            if to_date:
                query = query.lte("expense_date", to_date.isoformat())
            if category_id:
                query = query.eq("category_id", str(category_id))

            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Error listing expenses: {e}")
            return []

    @staticmethod
    async def get_expense_by_id(user_id: UUID, expense_id: UUID) -> Optional[Dict[str, Any]]:
        """Fetches a single expense. Returns None if not found or not owned by user."""
        client = ExpenseService._get_client()

        if client is None:
            return None

        try:
            response = (
                client.table("expenses")
                .select("*, categories(id, name, slug)")
                .eq("id", str(expense_id))
                .eq("user_id", str(user_id))   # isolation guard
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching expense {expense_id}: {e}")
            return None

    @staticmethod
    async def update_expense(
        user_id: UUID, expense_id: UUID, payload: ExpenseUpdate
    ) -> Optional[Dict[str, Any]]:
        """Updates allowed fields of an expense. Returns updated record or None."""
        client = ExpenseService._get_client()

        if client is None:
            return None

        # Build update dict with only provided fields
        update_data: Dict[str, Any] = {}
        if payload.amount is not None:
            update_data["amount"] = float(payload.amount)
        if payload.description is not None:
            update_data["description"] = payload.description
        if payload.merchant is not None:
            update_data["merchant"] = payload.merchant
        if payload.expense_date is not None:
            update_data["expense_date"] = payload.expense_date.isoformat()
        if payload.category_id is not None:
            update_data["category_id"] = str(payload.category_id)

        if not update_data:
            # Nothing to update — return current record
            return await ExpenseService.get_expense_by_id(user_id, expense_id)

        try:
            response = (
                client.table("expenses")
                .update(update_data)
                .eq("id", str(expense_id))
                .eq("user_id", str(user_id))   # isolation guard
                .execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating expense {expense_id}: {e}")
            raise

    @staticmethod
    async def delete_expense(user_id: UUID, expense_id: UUID) -> bool:
        """Deletes an expense. Returns True on success, False if not found."""
        client = ExpenseService._get_client()

        if client is None:
            logger.warning("No DB client — simulating delete.")
            return True

        try:
            response = (
                client.table("expenses")
                .delete()
                .eq("id", str(expense_id))
                .eq("user_id", str(user_id))   # isolation guard
                .execute()
            )
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error deleting expense {expense_id}: {e}")
            raise
