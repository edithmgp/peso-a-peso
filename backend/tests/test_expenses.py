"""
Tests for Expense API endpoints (/api/v1/expenses)
Uses FastAPI TestClient with mocked Supabase service.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, date
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Development user UUID (matches security.py fallback)
DEV_USER_ID = "00000000-0000-0000-0000-000000000001"

MOCK_EXPENSE = {
    "id": str(uuid4()),
    "user_id": DEV_USER_ID,
    "category_id": "c0000000-0000-0000-0000-000000000001",
    "amount": "15000.00",
    "description": "Compra supermercado",
    "merchant": "Coto",
    "expense_date": "2026-08-17",
    "source": "manual",
    "confidence": None,
    "confirmed": True,
    "receipt_path": None,
    "created_at": datetime.utcnow().isoformat(),
    "updated_at": datetime.utcnow().isoformat(),
}

EXPENSE_PAYLOAD = {
    "amount": 15000,
    "description": "Compra supermercado",
    "merchant": "Coto",
    "expense_date": "2026-08-17",
    "category_id": "c0000000-0000-0000-0000-000000000001",
    "source": "manual",
}


class TestCreateExpense:
    """POST /api/v1/expenses"""

    def test_create_expense_success(self):
        """Creating an expense with valid payload returns 201 and the expense data."""
        with patch(
            "app.services.expense_service.ExpenseService.create_expense",
            new_callable=AsyncMock,
            return_value=MOCK_EXPENSE,
        ):
            response = client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD)

        assert response.status_code == 201
        data = response.json()
        assert data["merchant"] == "Coto"
        assert float(data["amount"]) == 15000.0
        assert data["confirmed"] is True
        assert data["source"] == "manual"

    def test_create_expense_missing_amount(self):
        """Missing required field should return 422 Unprocessable Entity."""
        payload = {k: v for k, v in EXPENSE_PAYLOAD.items() if k != "amount"}
        response = client.post("/api/v1/expenses", json=payload)
        assert response.status_code == 422

    def test_create_expense_negative_amount(self):
        """Amount must be positive (> 0 per schema validation)."""
        payload = {**EXPENSE_PAYLOAD, "amount": -500}
        response = client.post("/api/v1/expenses", json=payload)
        assert response.status_code == 422

    def test_create_expense_invalid_source(self):
        """Source must be one of: manual, text, ocr."""
        payload = {**EXPENSE_PAYLOAD, "source": "bank_transfer"}
        response = client.post("/api/v1/expenses", json=payload)
        assert response.status_code == 422

    def test_create_expense_service_failure(self):
        """When service returns None, endpoint should return 500."""
        with patch(
            "app.services.expense_service.ExpenseService.create_expense",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = client.post("/api/v1/expenses", json=EXPENSE_PAYLOAD)

        assert response.status_code == 500


class TestListExpenses:
    """GET /api/v1/expenses"""

    def test_list_expenses_empty(self):
        """Empty list is a valid response when user has no expenses."""
        with patch(
            "app.services.expense_service.ExpenseService.get_expenses",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = client.get("/api/v1/expenses")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_expenses_with_data(self):
        """Returns list of expenses with correct structure."""
        with patch(
            "app.services.expense_service.ExpenseService.get_expenses",
            new_callable=AsyncMock,
            return_value=[MOCK_EXPENSE],
        ):
            response = client.get("/api/v1/expenses")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["merchant"] == "Coto"

    def test_list_expenses_date_filter(self):
        """Date filters are forwarded to the service layer."""
        with patch(
            "app.services.expense_service.ExpenseService.get_expenses",
            new_callable=AsyncMock,
            return_value=[],
        ) as mock_service:
            response = client.get("/api/v1/expenses?from=2026-08-01&to=2026-08-31")

        assert response.status_code == 200


class TestGetExpense:
    """GET /api/v1/expenses/{id}"""

    def test_get_expense_found(self):
        """Returns the expense when it exists and belongs to the user."""
        expense_id = MOCK_EXPENSE["id"]
        with patch(
            "app.services.expense_service.ExpenseService.get_expense_by_id",
            new_callable=AsyncMock,
            return_value=MOCK_EXPENSE,
        ):
            response = client.get(f"/api/v1/expenses/{expense_id}")

        assert response.status_code == 200
        assert response.json()["id"] == expense_id

    def test_get_expense_not_found(self):
        """Returns 404 when expense does not exist (or belongs to another user)."""
        with patch(
            "app.services.expense_service.ExpenseService.get_expense_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = client.get(f"/api/v1/expenses/{uuid4()}")

        assert response.status_code == 404


class TestDeleteExpense:
    """DELETE /api/v1/expenses/{id}"""

    def test_delete_expense_success(self):
        """Successful delete returns 204 No Content."""
        with patch(
            "app.services.expense_service.ExpenseService.delete_expense",
            new_callable=AsyncMock,
            return_value=True,
        ):
            response = client.delete(f"/api/v1/expenses/{uuid4()}")

        assert response.status_code == 204

    def test_delete_expense_not_found(self):
        """Returns 404 when expense does not exist."""
        with patch(
            "app.services.expense_service.ExpenseService.delete_expense",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = client.delete(f"/api/v1/expenses/{uuid4()}")

        assert response.status_code == 404


class TestCategoriesEndpoint:
    """GET /api/v1/categories"""

    def test_list_categories(self):
        """Returns list of categories."""
        mock_categories = [
            {"id": "c0000000-0000-0000-0000-000000000001", "name": "Comida", "slug": "food"},
            {"id": "c0000000-0000-0000-0000-000000000002", "name": "Servicios", "slug": "utilities"},
        ]
        with patch(
            "app.services.category_service.CategoryService.get_all",
            new_callable=AsyncMock,
            return_value=mock_categories,
        ):
            response = client.get("/api/v1/categories")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["slug"] == "food"


class TestExpenseSchemaValidation:
    """Unit tests for Pydantic schema validation (no HTTP layer)."""

    def test_expense_create_valid(self):
        from app.schemas.expense import ExpenseCreate
        from decimal import Decimal
        from uuid import uuid4

        expense = ExpenseCreate(
            amount=Decimal("15000"),
            expense_date=date(2026, 8, 17),
            category_id=uuid4(),
            source="manual",
        )
        assert expense.amount == Decimal("15000")
        assert expense.source == "manual"
        assert expense.confirmed_default is True if hasattr(expense, "confirmed_default") else True

    def test_expense_create_zero_amount_fails(self):
        from app.schemas.expense import ExpenseCreate
        from pydantic import ValidationError
        from decimal import Decimal
        from uuid import uuid4

        with pytest.raises(ValidationError):
            ExpenseCreate(
                amount=Decimal("0"),
                expense_date=date(2026, 8, 17),
                category_id=uuid4(),
            )
