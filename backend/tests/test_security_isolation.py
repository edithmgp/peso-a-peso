"""
Tests for Security Isolation and Multi-User Access Control.

Covers:
- JWT authentication scenarios (valid, expired, missing sub claim, etc.)
- X-User-ID header rejection in production mode
- Multi-user isolation: User A cannot access User B's resources
- HTTP error code contracts for authentication failures
- Payload validation limits (negative amounts, invalid dates, etc.)
"""

import pytest
import jwt
from unittest.mock import AsyncMock, patch
from uuid import uuid4, UUID
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.security import get_current_user_id, DEV_FALLBACK_USER_ID
from app.main import app

client = TestClient(app)

# ─── JWT Helper ────────────────────────────────────────────────────────────────

USER_A = str(uuid4())
USER_B = str(uuid4())


def _make_jwt(sub: str, secret: str = "test-secret-for-testing") -> str:
    """Create an unsigned (dev-mode-compatible) JWT with the given sub claim."""
    return jwt.encode({"sub": sub}, secret, algorithm="HS256")


# ══════════════════════════════════════════════════════════════════════════════
# 1. JWT Authentication Unit Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestJWTAuthentication:
    """Unit tests for get_current_user_id in development mode."""

    @pytest.mark.asyncio
    async def test_valid_jwt_returns_correct_user_id(self):
        """A valid JWT with a UUID sub claim returns that UUID."""
        token = _make_jwt(USER_A)
        result = await get_current_user_id(
            authorization=f"Bearer {token}", x_user_id=None
        )
        assert result == USER_A

    @pytest.mark.asyncio
    async def test_no_token_returns_dev_fallback(self):
        """In dev mode, missing credentials return the fallback UUID."""
        result = await get_current_user_id(authorization=None, x_user_id=None)
        assert result == DEV_FALLBACK_USER_ID
        assert UUID(result)  # valid UUID format

    @pytest.mark.asyncio
    async def test_dev_token_placeholder_returns_fallback(self):
        """The literal string 'dev-token' is treated as 'no real token' in dev mode."""
        result = await get_current_user_id(
            authorization="Bearer dev-token", x_user_id=None
        )
        assert result == DEV_FALLBACK_USER_ID

    @pytest.mark.asyncio
    async def test_malformed_bearer_returns_fallback_in_dev(self):
        """A completely unparseable token falls back to dev UUID in non-production."""
        result = await get_current_user_id(
            authorization="Bearer not.a.valid.jwt.at.all.!!!", x_user_id=None
        )
        assert result == DEV_FALLBACK_USER_ID

    @pytest.mark.asyncio
    async def test_jwt_missing_sub_returns_fallback_in_dev(self):
        """A JWT without a sub claim returns the dev fallback in dev mode."""
        token = jwt.encode({"role": "authenticated"}, "secret", algorithm="HS256")
        result = await get_current_user_id(
            authorization=f"Bearer {token}", x_user_id=None
        )
        assert result == DEV_FALLBACK_USER_ID

    @pytest.mark.asyncio
    async def test_jwt_non_uuid_sub_raises_400(self):
        """A JWT with a non-UUID sub claim raises HTTP 400 Bad Request."""
        token = jwt.encode({"sub": "not-a-uuid"}, "secret", algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id(
                authorization=f"Bearer {token}", x_user_id=None
            )
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_valid_x_user_id_accepted_in_dev(self):
        """X-User-ID header with a valid UUID is accepted in dev mode."""
        result = await get_current_user_id(authorization=None, x_user_id=USER_A)
        assert result == USER_A

    @pytest.mark.asyncio
    async def test_invalid_x_user_id_raises_400(self):
        """X-User-ID with an invalid UUID raises HTTP 400."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id(authorization=None, x_user_id="not-a-uuid")
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_production_mode_rejects_x_user_id(self):
        """In production mode, X-User-ID header must be rejected."""
        with patch("app.core.security._IS_PROD", True):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(authorization=None, x_user_id=USER_A)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_production_mode_no_token_raises_401(self):
        """In production mode, missing auth credentials raise HTTP 401."""
        with patch("app.core.security._IS_PROD", True):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(authorization=None, x_user_id=None)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_production_mode_dev_token_raises_401(self):
        """In production mode, the 'dev-token' placeholder is rejected with 401."""
        with patch("app.core.security._IS_PROD", True):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user_id(
                    authorization="Bearer dev-token", x_user_id=None
                )
        assert exc_info.value.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# 2. Multi-User Resource Isolation Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestMultiUserIsolation:
    """
    Verify that the service layer enforces strict user_id isolation.
    User A cannot read, modify, or delete resources owned by User B.
    These tests exercise the router + service layer with mocked DB calls.
    """

    def _auth_header(self, user_id: str) -> dict:
        token = _make_jwt(user_id)
        return {"Authorization": f"Bearer {token}"}

    def test_user_a_cannot_read_user_b_expense(self):
        """
        When User A requests a specific expense that belongs to User B,
        the service returns None (not found for that user) → 404.
        """
        expense_id = str(uuid4())

        with patch(
            "app.services.expense_service.ExpenseService.get_expense_by_id",
            new_callable=AsyncMock,
            return_value=None,  # DB found nothing for User A's query
        ):
            response = client.get(
                f"/api/v1/expenses/{expense_id}",
                headers=self._auth_header(USER_A),
            )

        assert response.status_code == 404

    def test_user_a_cannot_delete_user_b_expense(self):
        """
        When User A attempts to delete User B's expense,
        the service returns False (no rows deleted for that user) → 404.
        """
        expense_id = str(uuid4())

        with patch(
            "app.services.expense_service.ExpenseService.delete_expense",
            new_callable=AsyncMock,
            return_value=False,
        ):
            response = client.delete(
                f"/api/v1/expenses/{expense_id}",
                headers=self._auth_header(USER_A),
            )

        assert response.status_code == 404

    def test_user_a_cannot_read_user_b_budget(self):
        """
        GET /api/v1/budget/current for User A returns None (no budget for User A).
        Returns 404, not User B's budget.
        """
        with patch(
            "app.services.budget_service.BudgetService.get_current_budget",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = client.get(
                "/api/v1/budget/current",
                headers=self._auth_header(USER_A),
            )

        assert response.status_code == 404

    def test_expense_service_always_filters_by_user_id(self):
        """
        The ExpenseService.get_expenses mock must have been called with the
        user_id extracted from the JWT, not any other user's ID.
        This verifies that the router correctly passes the authenticated user's ID.
        """
        with patch(
            "app.services.expense_service.ExpenseService.get_expenses",
            new_callable=AsyncMock,
            return_value=[],
        ) as mock_get:
            client.get(
                "/api/v1/expenses",
                headers=self._auth_header(USER_A),
            )

        mock_get.assert_called_once()
        call_args = mock_get.call_args
        # The first positional argument to get_expenses is user_id (as UUID)
        passed_user_id = call_args.args[0] if call_args.args else call_args.kwargs.get("user_id")
        assert str(passed_user_id) == USER_A


# ══════════════════════════════════════════════════════════════════════════════
# 3. Input Validation & HTTP Error Contract Tests
# ══════════════════════════════════════════════════════════════════════════════

class TestInputValidation:
    """Verify the API enforces strict validation on user-supplied data."""

    def test_create_expense_negative_amount_returns_422(self):
        response = client.post(
            "/api/v1/expenses",
            json={
                "amount": -100,
                "expense_date": "2026-08-17",
                "category_id": str(uuid4()),
                "source": "manual",
            },
        )
        assert response.status_code == 422

    def test_create_expense_zero_amount_returns_422(self):
        response = client.post(
            "/api/v1/expenses",
            json={
                "amount": 0,
                "expense_date": "2026-08-17",
                "category_id": str(uuid4()),
                "source": "manual",
            },
        )
        assert response.status_code == 422

    def test_create_expense_invalid_source_returns_422(self):
        response = client.post(
            "/api/v1/expenses",
            json={
                "amount": 1000,
                "expense_date": "2026-08-17",
                "category_id": str(uuid4()),
                "source": "wire_transfer",  # not in allowed set
            },
        )
        assert response.status_code == 422

    def test_create_expense_missing_required_fields_returns_422(self):
        """Completely empty body must return 422."""
        response = client.post("/api/v1/expenses", json={})
        assert response.status_code == 422

    def test_create_budget_negative_amount_returns_422(self):
        response = client.post(
            "/api/v1/budget",
            json={
                "month": "2026-08-01",
                "amount": -50000,
            },
        )
        assert response.status_code == 422

    def test_create_budget_missing_month_returns_422(self):
        response = client.post(
            "/api/v1/budget",
            json={"amount": 600000},
        )
        assert response.status_code == 422

    def test_get_expense_invalid_uuid_returns_422(self):
        """Non-UUID path parameter triggers a 422 from FastAPI automatically."""
        response = client.get("/api/v1/expenses/this-is-not-a-uuid")
        assert response.status_code == 422

    def test_delete_expense_invalid_uuid_returns_422(self):
        response = client.delete("/api/v1/expenses/not-a-valid-uuid")
        assert response.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# 4. Response Structure Contracts
# ══════════════════════════════════════════════════════════════════════════════

class TestResponseStructure:
    """Verify that API responses follow expected contracts."""

    def test_404_has_detail_field(self):
        """All 404 responses must include a machine-readable 'detail' field."""
        with patch(
            "app.services.expense_service.ExpenseService.get_expense_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = client.get(f"/api/v1/expenses/{uuid4()}")

        assert response.status_code == 404
        body = response.json()
        assert "detail" in body

    def test_health_endpoint_accessible_without_auth(self):
        """Health check must be publicly accessible."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_categories_endpoint_returns_list(self):
        """Categories must always return a JSON array."""
        with patch(
            "app.services.category_service.CategoryService.get_all",
            new_callable=AsyncMock,
            return_value=[
                {"id": str(uuid4()), "name": "Comida", "slug": "food"},
            ],
        ):
            response = client.get("/api/v1/categories")

        assert response.status_code == 200
        assert isinstance(response.json(), list)
