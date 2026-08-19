"""
Deterministic Financial Calculations Service
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID


class FinancialService:
    """Handles core deterministic formulas (available per day, savings projection, anomalies)."""

    @staticmethod
    def calculate_available_per_day(
        remaining_budget: Decimal,
        remaining_days: int,
    ) -> Decimal:
        """Formula: remaining_budget / remaining_days (if remaining_days > 0)."""
        if remaining_days <= 0:
            return Decimal("0.00")
        return max(Decimal("0.00"), remaining_budget / Decimal(remaining_days))

    @staticmethod
    def calculate_projected_spending(
        spent_so_far: Decimal,
        days_passed: int,
        total_days_in_month: int,
    ) -> Decimal:
        """Deterministic projection: (spent / days_passed) * total_days."""
        if days_passed <= 0:
            return spent_so_far
        daily_pace = spent_so_far / Decimal(days_passed)
        return daily_pace * Decimal(total_days_in_month)
