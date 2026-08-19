"""
Deterministic Financial Calculations and Analytics Service
Implements rules from 0.ANA.md, 1.contratos-y-estructuras.md, and 2.estructura-DB.md.
"""

import calendar
import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.database import get_service_db, get_db
from app.services.budget_service import BudgetService
from app.services.fixed_expense_service import FixedExpenseService
from app.services.category_service import CategoryService
from app.services.alert_service import AlertService

logger = logging.getLogger(__name__)


class FinancialService:
    """Handles core deterministic formulas (available per day, savings projection, chart aggregation)."""

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

    @staticmethod
    async def calculate_monthly_metrics(
        user_id: UUID,
        target_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates all financial inputs to produce consolidated dashboard metrics.
        Calculates available today, budget summary, end-of-month projection, and active alerts.
        """
        today = target_date or date.today()
        _, total_days_in_month = calendar.monthrange(today.year, today.month)
        days_passed = today.day
        remaining_days = max(1, total_days_in_month - today.day + 1)

        # 1. Budget information
        budget_record = await BudgetService.get_current_budget(user_id)
        budget_total = Decimal(str(budget_record["amount"])) if budget_record else Decimal("0.00")

        # 2. Accumulated confirmed spending so far in month
        spent_so_far_float = await BudgetService.get_total_spent_current_month(user_id)
        spent_so_far = Decimal(str(spent_so_far_float))

        # 3. High-priority fixed expenses due in remaining days of month
        pending_high_fixed_float = await FixedExpenseService.get_total_pending_high_priority(
            user_id, from_day=today.day
        )
        pending_high_fixed = Decimal(str(pending_high_fixed_float))

        # 4. Deterministic Calculations
        raw_remaining = max(Decimal("0.00"), budget_total - spent_so_far)
        # Rule 2: high priority committed fixed costs deducted before calculating daily free cash
        real_available_budget = max(Decimal("0.00"), raw_remaining - pending_high_fixed)
        
        # Rule 3: available today
        available_today = FinancialService.calculate_available_per_day(
            remaining_budget=real_available_budget,
            remaining_days=remaining_days,
        )

        # Rule 4: end of month projection
        if days_passed > 0 and spent_so_far > Decimal("0.00"):
            projected_total = FinancialService.calculate_projected_spending(
                spent_so_far=spent_so_far,
                days_passed=days_passed,
                total_days_in_month=total_days_in_month,
            )
        else:
            projected_total = spent_so_far

        if budget_total > Decimal("0.00"):
            percentage_used = min(Decimal("100.00"), (spent_so_far / budget_total) * Decimal("100.00"))
            projected_savings = max(Decimal("0.00"), budget_total - projected_total)
            if projected_total > budget_total:
                status = "over_budget"
            elif projected_total > (budget_total * Decimal("0.90")):
                status = "warning"
            else:
                status = "on_track"
        else:
            percentage_used = Decimal("0.00")
            projected_savings = Decimal("0.00")
            status = "on_track"

        # 5. Alerts
        alerts = await AlertService.get_user_alerts(
            user_id=user_id,
            budget_total=float(budget_total),
            budget_spent=float(spent_so_far),
            projected_total=float(projected_total),
        )

        return {
            "available_today": available_today.quantize(Decimal("0.01")),
            "budget": {
                "total": budget_total.quantize(Decimal("0.01")),
                "spent": spent_so_far.quantize(Decimal("0.01")),
                "remaining": raw_remaining.quantize(Decimal("0.01")),
                "percentage_used": percentage_used.quantize(Decimal("0.01")),
            },
            "projection": {
                "projected_total": projected_total.quantize(Decimal("0.01")),
                "projected_savings": projected_savings.quantize(Decimal("0.01")),
                "status": status,
            },
            "alerts": alerts,
            "meta": {
                "days_in_month": total_days_in_month,
                "days_passed": days_passed,
                "remaining_days": remaining_days,
                "pending_fixed_expenses": pending_high_fixed.quantize(Decimal("0.01")),
            },
        }

    @staticmethod
    async def get_category_spending_breakdown(
        user_id: UUID,
        target_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """
        Aggregates current month expenses grouped by category for Recharts visualization.
        """
        client = get_service_db() or get_db()
        today = target_date or date.today()
        month_start = today.replace(day=1).isoformat()
        month_end = today.isoformat()

        categories = await CategoryService.get_all()
        cat_map = {c["id"]: c for c in categories}

        category_totals: Dict[str, float] = {c["slug"]: 0.0 for c in categories}
        category_names: Dict[str, str] = {c["slug"]: c["name"] for c in categories}

        if client is not None:
            try:
                response = (
                    client.table("expenses")
                    .select("amount, category_id")
                    .eq("user_id", str(user_id))
                    .eq("confirmed", True)
                    .gte("expense_date", month_start)
                    .lte("expense_date", month_end)
                    .execute()
                )
                for row in (response.data or []):
                    cat_id = row.get("category_id")
                    cat_info = cat_map.get(cat_id)
                    slug = cat_info["slug"] if cat_info else "other"
                    category_totals[slug] = category_totals.get(slug, 0.0) + float(row["amount"])
            except Exception as e:
                logger.error(f"Error getting category breakdown: {e}")

        breakdown = [
            {
                "slug": slug,
                "name": category_names.get(slug, slug.capitalize()),
                "amount": round(total, 2),
            }
            for slug, total in category_totals.items()
        ]
        return sorted(breakdown, key=lambda x: x["amount"], reverse=True)

    @staticmethod
    async def get_daily_spending_timeline(
        user_id: UUID,
        target_date: Optional[date] = None,
    ) -> List[Dict[str, Any]]:
        """
        Generates day-by-day accumulated spending curve vs ideal linear budget pace for Recharts.
        """
        client = get_service_db() or get_db()
        today = target_date or date.today()
        _, total_days = calendar.monthrange(today.year, today.month)
        month_start = today.replace(day=1).isoformat()
        month_end = today.isoformat()

        budget_record = await BudgetService.get_current_budget(user_id)
        budget_total = float(budget_record["amount"]) if budget_record else 0.0
        ideal_daily_rate = budget_total / total_days if total_days > 0 else 0.0

        daily_spent: Dict[int, float] = {day: 0.0 for day in range(1, total_days + 1)}

        if client is not None:
            try:
                response = (
                    client.table("expenses")
                    .select("amount, expense_date")
                    .eq("user_id", str(user_id))
                    .eq("confirmed", True)
                    .gte("expense_date", month_start)
                    .lte("expense_date", month_end)
                    .execute()
                )
                for row in (response.data or []):
                    exp_date = datetime.strptime(row["expense_date"], "%Y-%m-%d").date()
                    daily_spent[exp_date.day] = daily_spent.get(exp_date.day, 0.0) + float(row["amount"])
            except Exception as e:
                logger.error(f"Error fetching daily spending: {e}")

        accumulated_actual = 0.0
        timeline: List[Dict[str, Any]] = []

        for day in range(1, total_days + 1):
            ideal_pace = round(ideal_daily_rate * day, 2)
            if day <= today.day:
                accumulated_actual += daily_spent[day]
                actual_val: Optional[float] = round(accumulated_actual, 2)
            else:
                actual_val = None  # Future days don't have actual data yet

            timeline.append({
                "day": day,
                "label": f"Día {day}",
                "ideal": ideal_pace,
                "actual": actual_val,
                "daily_spent": round(daily_spent[day], 2) if day <= today.day else 0.0,
            })

        return timeline
