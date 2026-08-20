"""
Unit and Integration tests for Meta-Agent, Persistent Memory and Profile Adaptation
"""

from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from app.agents.meta_agent import MetaAgent
from app.agents.evaluator_agent import EvaluatorAgent
from app.services.profile_service import ProfileService
from app.schemas.agents import AgentContext
from app.schemas.analysis import FinancialAnalysis, FinancialProjection
from app.schemas.expense import ExpenseResponse
from app.main import app

client = TestClient(app)

DEV_USER_ID = uuid4()
DEV_CATEGORY_ID = uuid4()


@pytest.mark.asyncio
class TestProfileServiceAdaptation:
    """Testing sensitivity adjustments and profile updates."""

    async def test_adapt_category_score_useful(self):
        user_id = uuid4()
        with patch("app.services.profile_service.ProfileService._get_client", return_value=None):
            result = await ProfileService.adapt_category_score(user_id, "food", useful=True)

        assert result["previous_score"] == 1.0
        assert result["new_score"] == 1.10
        assert result["all_scores"]["food"] == 1.10

    async def test_adapt_category_score_not_useful(self):
        user_id = uuid4()
        with patch("app.services.profile_service.ProfileService._get_client", return_value=None):
            result = await ProfileService.adapt_category_score(user_id, "leisure", useful=False)

        assert result["previous_score"] == 1.0
        assert result["new_score"] == 0.75
        assert result["all_scores"]["leisure"] == 0.75


@pytest.mark.asyncio
class TestMetaAgentExecution:
    """Testing MetaAgent continuous learning loop."""

    async def test_meta_agent_adapts_and_logs(self):
        agent = MetaAgent()
        alert_id = uuid4()
        context = AgentContext(
            request_id=uuid4(),
            user_id=DEV_USER_ID,
            metadata={"alert_id": str(alert_id), "feedback": "not_useful", "category_slug": "food"},
        )

        with patch("app.services.profile_service.ProfileService.adapt_category_score", new_callable=AsyncMock) as mock_adapt, \
             patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock) as mock_log:
            mock_adapt.return_value = {"previous_score": 1.0, "new_score": 0.75, "all_scores": {"food": 0.75}}
            res = await agent.execute(context)

        assert res.status == "success"
        assert res.output["adapted"] is True
        assert res.output["new_score"] == 0.75
        mock_log.assert_called_once()


@pytest.mark.asyncio
class TestEvaluatorMemoryFiltering:
    """Testing that EvaluatorAgent respects persistent memory and suppresses low-sensitivity warnings."""

    async def test_evaluator_suppresses_alert_when_score_is_low(self):
        agent = EvaluatorAgent()
        context = AgentContext(request_id=uuid4(), user_id=DEV_USER_ID)
        context.analysis = FinancialAnalysis(
            daily_average=Decimal("5000.00"),
            category_average=Decimal("5000.00"),
            category_deviation=Decimal("200.00"),
            spending_velocity=Decimal("50.00"),
            anomaly_detected=True,
            anomaly_score=Decimal("0.80"),
            risk_level="medium",
        )
        context.projection = FinancialProjection(
            remaining_budget=Decimal("400000.00"),
            remaining_days=10,
            available_per_day=Decimal("40000.00"),
            projected_monthly_spending=Decimal("450000.00"),
            projected_savings=Decimal("50000.00"),
            budget_risk="low",
        )

        # Profile with low sensitivity in 'food' (< 0.60)
        low_score_profile = {
            "id": str(DEV_USER_ID),
            "alert_frequency": "normal",
            "category_scores": {"food": 0.40, "other": 0.40},
        }

        with patch("app.services.profile_service.ProfileService.get_or_create_profile", new_callable=AsyncMock, return_value=low_score_profile), \
             patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock):
            result = await agent.execute(context)

        assert result.status == "success"
        assert context.evaluation is not None
        # Should be suppressed by memory!
        assert context.evaluation.should_alert is False
        assert result.output["suppressed_by_memory"] is True


class TestProfileAPI:
    """GET /api/v1/profile and PUT /api/v1/profile"""

    def test_get_profile(self):
        mock_profile = {
            "id": str(DEV_USER_ID),
            "full_name": "Demo User",
            "currency": "ARS",
            "monthly_income": 600000.0,
            "payday": 5,
            "preferred_tone": "friendly",
            "alert_frequency": "normal",
            "category_scores": {"food": 1.1, "transport": 0.9},
            "created_at": "2026-08-18T00:00:00Z",
            "updated_at": "2026-08-18T00:00:00Z",
        }

        with patch("app.services.profile_service.ProfileService.get_or_create_profile", new_callable=AsyncMock, return_value=mock_profile):
            response = client.get("/api/v1/profile")

        assert response.status_code == 200
        data = response.json()
        assert data["preferred_tone"] == "friendly"
        assert data["category_scores"]["food"] == 1.1

    def test_update_profile(self):
        mock_updated = {
            "id": str(DEV_USER_ID),
            "full_name": "Demo User",
            "currency": "ARS",
            "monthly_income": 750000.0,
            "payday": 10,
            "preferred_tone": "direct",
            "alert_frequency": "low",
            "category_scores": {"food": 1.0},
            "created_at": "2026-08-18T00:00:00Z",
            "updated_at": "2026-08-18T00:00:00Z",
        }

        with patch("app.services.profile_service.ProfileService.update_profile", new_callable=AsyncMock, return_value=mock_updated):
            response = client.put("/api/v1/profile", json={"preferred_tone": "direct", "alert_frequency": "low", "monthly_income": 750000})

        assert response.status_code == 200
        data = response.json()
        assert data["preferred_tone"] == "direct"
        assert data["alert_frequency"] == "low"
