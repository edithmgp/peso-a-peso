"""
Integration tests for Dashboard & Alerts API endpoints
"""

from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestDashboardAPI:
    """GET /api/v1/dashboard and /api/v1/dashboard/charts"""

    def test_get_dashboard_success(self):
        """Returns 200 with structured deterministic calculations."""
        mock_metrics = {
            "available_today": Decimal("18500.00"),
            "budget": {
                "total": Decimal("600000.00"),
                "spent": Decimal("420000.00"),
                "remaining": Decimal("180000.00"),
                "percentage_used": Decimal("70.00"),
            },
            "projection": {
                "projected_total": Decimal("575000.00"),
                "projected_savings": Decimal("25000.00"),
                "status": "on_track",
            },
            "alerts": [],
            "meta": {"remaining_days": 10},
        }

        with patch("app.services.financial_service.FinancialService.calculate_monthly_metrics", new_callable=AsyncMock, return_value=mock_metrics):
            response = client.get("/api/v1/dashboard")

        assert response.status_code == 200
        data = response.json()
        assert float(data["available_today"]) == 18500.0
        assert data["projection"]["status"] == "on_track"

    def test_get_dashboard_charts_success(self):
        """Returns categories breakdown and daily spending timeline."""
        mock_categories = [
            {"slug": "food", "name": "Comida", "amount": 45000.0},
            {"slug": "transport", "name": "Transporte", "amount": 12000.0},
        ]
        mock_timeline = [
            {"day": 1, "label": "Día 1", "ideal": 20000.0, "actual": 15000.0, "daily_spent": 15000.0},
            {"day": 2, "label": "Día 2", "ideal": 40000.0, "actual": 30000.0, "daily_spent": 15000.0},
        ]

        with patch("app.services.financial_service.FinancialService.get_category_spending_breakdown", new_callable=AsyncMock, return_value=mock_categories), \
             patch("app.services.financial_service.FinancialService.get_daily_spending_timeline", new_callable=AsyncMock, return_value=mock_timeline):
            response = client.get("/api/v1/dashboard/charts")

        assert response.status_code == 200
        data = response.json()
        assert len(data["categories"]) == 2
        assert len(data["timeline"]) == 2
        assert data["categories"][0]["slug"] == "food"


class TestAlertsAPI:
    """GET /api/v1/alerts and POST /api/v1/alerts/{id}/feedback"""

    def test_list_alerts(self):
        """Returns list of active alerts."""
        mock_alerts = [
            {
                "id": str(uuid4()),
                "user_id": str(uuid4()),
                "type": "budget_warning",
                "severity": "warning",
                "title": "Alerta de consumo",
                "message": "Presupuesto alcanzando el 85%",
                "category_id": None,
                "agent_source": "evaluator",
                "created_at": "2026-08-18T00:00:00Z",
                "seen_at": None,
            }
        ]

        with patch("app.services.alert_service.AlertService.get_user_alerts", new_callable=AsyncMock, return_value=mock_alerts):
            response = client.get("/api/v1/alerts")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["severity"] == "warning"

    def test_submit_alert_feedback(self):
        """Submitting user feedback returns 200 with learned status."""
        alert_id = uuid4()
        payload = {"feedback": "useful"}

        with patch("app.services.alert_service.AlertService.record_feedback", new_callable=AsyncMock, return_value={"status": "success", "alert_id": str(alert_id), "feedback": "useful", "learned": True}):
            response = client.post(f"/api/v1/alerts/{alert_id}/feedback", json=payload)

        assert response.status_code == 200
        assert response.json()["feedback"] == "useful"
        assert response.json()["learned"] is True
