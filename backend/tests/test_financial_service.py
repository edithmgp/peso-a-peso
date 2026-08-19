"""
Unit tests for deterministic financial formulas (FinancialService)
Validates business rules from Doc 0.ANA.md and 1.contratos-y-estructuras.md.
"""

from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4
import pytest

from app.services.financial_service import FinancialService


class TestFinancialFormulas:
    """Testing pure mathematical deterministic calculations."""

    def test_available_per_day_normal(self):
        """600,000 / 30 = 20,000 per day."""
        res = FinancialService.calculate_available_per_day(
            remaining_budget=Decimal("600000.00"),
            remaining_days=30,
        )
        assert res == Decimal("20000.00")

    def test_available_per_day_zero_or_negative_days(self):
        """0 or negative days should return 0 safely."""
        res = FinancialService.calculate_available_per_day(
            remaining_budget=Decimal("100000.00"),
            remaining_days=0,
        )
        assert res == Decimal("0.00")

    def test_available_per_day_negative_budget(self):
        """If remaining budget is negative, return 0 (no negative daily allowance)."""
        res = FinancialService.calculate_available_per_day(
            remaining_budget=Decimal("-5000.00"),
            remaining_days=10,
        )
        assert res == Decimal("0.00")

    def test_projected_spending_mid_month(self):
        """Spent 150,000 in 15 days of a 30-day month -> projected 300,000."""
        res = FinancialService.calculate_projected_spending(
            spent_so_far=Decimal("150000.00"),
            days_passed=15,
            total_days_in_month=30,
        )
        assert res == Decimal("300000.00")

    def test_projected_spending_day_zero(self):
        """Day 0 returns spent_so_far without dividing by zero."""
        res = FinancialService.calculate_projected_spending(
            spent_so_far=Decimal("50000.00"),
            days_passed=0,
            total_days_in_month=31,
        )
        assert res == Decimal("50000.00")


@pytest.mark.asyncio
class TestMonthlyMetricsIntegration:
    """Testing calculate_monthly_metrics with mocked database dependencies."""

    async def test_calculate_monthly_metrics_on_track(self):
        """User with budget 600,000, spent 100,000 on day 10 of 30, no fixed expenses."""
        user_id = uuid4()
        target_date = date(2026, 8, 10)  # August has 31 days

        with patch("app.services.budget_service.BudgetService.get_current_budget", new_callable=AsyncMock) as mock_b, \
             patch("app.services.budget_service.BudgetService.get_total_spent_current_month", new_callable=AsyncMock) as mock_s, \
             patch("app.services.fixed_expense_service.FixedExpenseService.get_total_pending_high_priority", new_callable=AsyncMock) as mock_f:
            mock_b.return_value = {"amount": 600000.0}
            mock_s.return_value = 100000.0
            mock_f.return_value = 0.0

            metrics = await FinancialService.calculate_monthly_metrics(user_id, target_date=target_date)

        assert metrics["budget"]["total"] == Decimal("600000.00")
        assert metrics["budget"]["spent"] == Decimal("100000.00")
        assert metrics["budget"]["remaining"] == Decimal("500000.00")
        assert metrics["projection"]["status"] == "on_track"
        # remaining days = 31 - 10 + 1 = 22
        # available today = 500,000 / 22 = 22,727.27
        assert metrics["available_today"] == Decimal("22727.27")

    async def test_fixed_expenses_priority_deducted_from_available(self):
        """High priority upcoming fixed expenses must be deducted before computing available daily cash."""
        user_id = uuid4()
        target_date = date(2026, 8, 10)  # 22 remaining days

        with patch("app.services.budget_service.BudgetService.get_current_budget", new_callable=AsyncMock) as mock_b, \
             patch("app.services.budget_service.BudgetService.get_total_spent_current_month", new_callable=AsyncMock) as mock_s, \
             patch("app.services.fixed_expense_service.FixedExpenseService.get_total_pending_high_priority", new_callable=AsyncMock) as mock_f:
            mock_b.return_value = {"amount": 600000.0}
            mock_s.return_value = 100000.0
            # 60,000 in upcoming rent/utilities due later this month
            mock_f.return_value = 60000.0

            metrics = await FinancialService.calculate_monthly_metrics(user_id, target_date=target_date)

        # Real available = 500,000 - 60,000 = 440,000
        # available today = 440,000 / 22 = 20,000.00
        assert metrics["available_today"] == Decimal("20000.00")

    async def test_over_budget_status_trigger(self):
        """When spending pace exceeds budget, status becomes over_budget and alert is generated."""
        user_id = uuid4()
        target_date = date(2026, 8, 10)  # Day 10 of 31

        with patch("app.services.budget_service.BudgetService.get_current_budget", new_callable=AsyncMock) as mock_b, \
             patch("app.services.budget_service.BudgetService.get_total_spent_current_month", new_callable=AsyncMock) as mock_s, \
             patch("app.services.fixed_expense_service.FixedExpenseService.get_total_pending_high_priority", new_callable=AsyncMock) as mock_f:
            mock_b.return_value = {"amount": 300000.0}
            # Spent 200,000 in 10 days -> projected (200k/10)*31 = 620,000
            mock_s.return_value = 200000.0
            mock_f.return_value = 0.0

            metrics = await FinancialService.calculate_monthly_metrics(user_id, target_date=target_date)

        assert metrics["projection"]["status"] == "over_budget"
        assert metrics["projection"]["projected_total"] == Decimal("620000.00")
        assert len(metrics["alerts"]) >= 1
