"""
Unit and Integration tests for Multi-Agent OODA Pipeline & Orchestrator
"""

from datetime import date, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from app.agents.capture_agent import CaptureAgent
from app.agents.analyzer_agent import AnalyzerAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.evaluator_agent import EvaluatorAgent
from app.orchestrator.orchestrator import Orchestrator
from app.schemas.agents import AgentContext
from app.schemas.expense import ExpenseResponse
from app.main import app

client = TestClient(app)

DEV_USER_ID = uuid4()
DEV_CATEGORY_ID = uuid4()

SAMPLE_EXPENSE = ExpenseResponse(
    id=uuid4(),
    user_id=DEV_USER_ID,
    category_id=DEV_CATEGORY_ID,
    amount=Decimal("25000.00"),
    description="Cena restaurante",
    merchant="La Cabrera",
    expense_date=date(2026, 8, 18),
    source="manual",
    confidence=None,
    confirmed=True,
    receipt_path=None,
    created_at=datetime.utcnow(),
    updated_at=datetime.utcnow(),
)


@pytest.mark.asyncio
class TestAgentsIndividually:
    """Testing each agent's single-responsibility execution."""

    async def test_capture_agent_valid(self):
        agent = CaptureAgent()
        context = AgentContext(request_id=uuid4(), user_id=DEV_USER_ID, expense=SAMPLE_EXPENSE)
        with patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock) as mock_log:
            result = await agent.execute(context)

        assert result.status == "success"
        assert result.agent_name == "capture"
        assert result.output["validated"] is True
        mock_log.assert_called_once()

    async def test_analyzer_agent_detects_anomaly(self):
        """Historical average 5,000 vs current 25,000 (5x higher) -> anomaly flagged."""
        agent = AnalyzerAgent()
        context = AgentContext(request_id=uuid4(), user_id=DEV_USER_ID, expense=SAMPLE_EXPENSE)

        # Mock DB returning historical expenses averaging 5,000
        mock_client = MagicMock()
        mock_client.table().select().eq().eq().neq().limit().execute.return_value.data = [
            {"amount": 5000.0},
            {"amount": 5200.0},
            {"amount": 4800.0},
        ]

        with patch("app.agents.analyzer_agent.get_service_db", return_value=mock_client), \
             patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock):
            result = await agent.execute(context)

        assert result.status == "success"
        assert context.analysis is not None
        assert context.analysis.anomaly_detected is True
        assert context.analysis.risk_level in ["medium", "high"]

    async def test_planner_agent_calculates_projection(self):
        agent = PlannerAgent()
        context = AgentContext(request_id=uuid4(), user_id=DEV_USER_ID, expense=SAMPLE_EXPENSE)

        mock_metrics = {
            "available_today": Decimal("15000.00"),
            "budget": {"total": Decimal("600000.00"), "spent": Decimal("125000.00"), "remaining": Decimal("475000.00"), "percentage_used": Decimal("20.83")},
            "projection": {"projected_total": Decimal("500000.00"), "projected_savings": Decimal("100000.00"), "status": "on_track"},
            "meta": {"remaining_days": 13},
        }

        with patch("app.services.financial_service.FinancialService.calculate_monthly_metrics", new_callable=AsyncMock, return_value=mock_metrics), \
             patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock):
            result = await agent.execute(context)

        assert result.status == "success"
        assert context.projection is not None
        assert context.projection.available_per_day == Decimal("15000.00")
        assert context.projection.budget_risk == "low"

    async def test_evaluator_agent_emits_alert_on_anomaly(self):
        agent = EvaluatorAgent()
        context = AgentContext(request_id=uuid4(), user_id=DEV_USER_ID, expense=SAMPLE_EXPENSE)
        
        from app.schemas.analysis import FinancialAnalysis, FinancialProjection
        context.analysis = FinancialAnalysis(
            daily_average=Decimal("5000.00"),
            category_average=Decimal("5000.00"),
            category_deviation=Decimal("200.00"),
            spending_velocity=Decimal("400.00"),
            anomaly_detected=True,
            anomaly_score=Decimal("0.95"),
            risk_level="high",
        )
        context.projection = FinancialProjection(
            remaining_budget=Decimal("400000.00"),
            remaining_days=10,
            available_per_day=Decimal("40000.00"),
            projected_monthly_spending=Decimal("550000.00"),
            projected_savings=Decimal("50000.00"),
            budget_risk="low",
        )

        mock_client = MagicMock()
        mock_client.table().insert().execute.return_value.data = [{"id": "alert-123"}]

        with patch("app.agents.evaluator_agent.get_service_db", return_value=mock_client), \
             patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock):
            result = await agent.execute(context)

        assert result.status == "success"
        assert context.evaluation is not None
        assert context.evaluation.should_alert is True
        assert context.evaluation.severity in ["warning", "critical"]


@pytest.mark.asyncio
class TestFullOODAOrchestrator:
    """Testing the sequential multi-agent OODA cycle end-to-end."""

    async def test_run_expense_cycle_complete(self):
        orchestrator = Orchestrator()
        context = AgentContext(request_id=uuid4(), user_id=DEV_USER_ID, expense=SAMPLE_EXPENSE)

        with patch("app.services.db_service.DatabaseService.log_agent_event", new_callable=AsyncMock) as mock_log:
            result_context = await orchestrator.run_expense_cycle(context)

        assert result_context.metadata.get("ooda_completed") is True
        assert len(result_context.metadata.get("steps", [])) == 4
        assert result_context.analysis is not None
        assert result_context.projection is not None
        assert result_context.evaluation is not None
        # 4 agents logged traces to agent_events
        assert mock_log.call_count >= 4


class TestAgentEventsAPI:
    """GET /api/v1/agent-events"""

    def test_list_agent_events_endpoint(self):
        mock_events = [
            {"id": "evt-1", "agent_name": "capture", "event_type": "expense_captured", "status": "success"},
            {"id": "evt-2", "agent_name": "analyzer", "event_type": "pattern_analyzed", "status": "success"},
        ]
        mock_client = MagicMock()
        mock_client.table().select().eq().order().limit().execute.return_value.data = mock_events

        with patch("app.api.routes.agent_events.get_service_db", return_value=mock_client):
            response = client.get("/api/v1/agent-events")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["agent_name"] == "capture"
