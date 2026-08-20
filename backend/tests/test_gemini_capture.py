"""
Unit and Integration tests for Intelligent Ingestion & Gemini Capture
"""

import io
from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from app.services.gemini_service import GeminiService
from app.main import app

client = TestClient(app)

MOCK_CATEGORIES = [
    {"id": "c0000000-0000-0000-0000-000000000001", "name": "Comida", "slug": "food"},
    {"id": "c0000000-0000-0000-0000-000000000002", "name": "Servicios", "slug": "utilities"},
    {"id": "c0000000-0000-0000-0000-000000000003", "name": "Transporte", "slug": "transport"},
    {"id": "c0000000-0000-0000-0000-000000000004", "name": "Ocio", "slug": "leisure"},
    {"id": "c0000000-0000-0000-0000-000000000005", "name": "Vivienda", "slug": "housing"},
    {"id": "c0000000-0000-0000-0000-000000000006", "name": "Salud", "slug": "health"},
    {"id": "c0000000-0000-0000-0000-000000000007", "name": "Educación", "slug": "education"},
    {"id": "c0000000-0000-0000-0000-000000000008", "name": "Otros", "slug": "other"},
]


class TestGeminiServiceTextExtraction:
    """Testing natural language parser and entity extraction."""

    @pytest.mark.asyncio
    async def test_extract_supermarket_expense(self):
        text = "Gasté $15.000 en Coto comprando carne y verduras"
        res = await GeminiService.extract_from_text(text, MOCK_CATEGORIES)

        assert res["amount"] == 15000.0
        assert res["merchant"] == "Coto"
        assert res["category_slug"] == "food"
        assert res["confidence"] >= 0.8

    @pytest.mark.asyncio
    async def test_extract_utility_expense(self):
        text = "Pagué 32500 de luz Edenor"
        res = await GeminiService.extract_from_text(text, MOCK_CATEGORIES)

        assert res["amount"] == 32500.0
        assert res["merchant"] == "Edenor"
        assert res["category_slug"] == "utilities"

    @pytest.mark.asyncio
    async def test_extract_transport_expense(self):
        text = "Viaje en Uber $8400"
        res = await GeminiService.extract_from_text(text, MOCK_CATEGORIES)

        assert res["amount"] == 8400.0
        assert res["merchant"] == "Uber"
        assert res["category_slug"] == "transport"


class TestCaptureEndpoints:
    """Testing POST /capture/text, /capture/receipt, and /capture/confirm"""

    def test_capture_text_endpoint(self):
        payload = {"text": "Gasté $12.500 en Farmacity"}
        with patch("app.services.category_service.CategoryService.get_all", new_callable=AsyncMock, return_value=MOCK_CATEGORIES):
            response = client.post("/api/v1/capture/text", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert float(data["amount"]) == 12500.0
        assert data["merchant"] == "Farmacity"
        assert float(data["confidence"]) > 0.7

    def test_capture_receipt_endpoint(self):
        fake_image = io.BytesIO(b"fake image data")
        with patch("app.services.category_service.CategoryService.get_all", new_callable=AsyncMock, return_value=MOCK_CATEGORIES):
            response = client.post(
                "/api/v1/capture/receipt",
                files={"file": ("ticket_coto.jpg", fake_image, "image/jpeg")},
            )

        assert response.status_code == 200
        data = response.json()
        assert float(data["amount"]) > 0
        assert float(data["confidence"]) >= 0.9

    def test_confirm_candidate_endpoint(self):
        payload = {
            "amount": 15000.0,
            "category_id": "c0000000-0000-0000-0000-000000000001",
            "expense_date": str(date.today()),
            "merchant": "Coto",
            "description": "Compra carne",
            "source": "text",
            "confidence": 0.95,
        }

        mock_created = {
            "id": str(uuid4()),
            "user_id": str(uuid4()),
            "category_id": payload["category_id"],
            "amount": payload["amount"],
            "description": payload["description"],
            "merchant": payload["merchant"],
            "expense_date": payload["expense_date"],
            "source": "text",
            "confidence": payload["confidence"],
            "confirmed": True,
            "receipt_path": None,
            "created_at": "2026-08-19T00:00:00Z",
            "updated_at": "2026-08-19T00:00:00Z",
        }

        with patch("app.services.expense_service.ExpenseService.create_expense", new_callable=AsyncMock, return_value=mock_created), \
             patch("app.orchestrator.orchestrator.Orchestrator.run_expense_cycle", new_callable=AsyncMock):
            response = client.post("/api/v1/capture/confirm", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["confirmed"] is True
        assert data["source"] == "text"
        assert float(data["amount"]) == 15000.0
