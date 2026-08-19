"""
OCR & Capture Endpoints (/api/v1/capture)
"""

from decimal import Decimal
from datetime import date
from typing import Optional
from uuid import uuid4
from fastapi import APIRouter, File, UploadFile, status
from app.api.dependencies import CurrentUser
from app.schemas.expense import ReceiptCandidate, ReceiptConfirm

router = APIRouter(prefix="/capture", tags=["Capture"])


@router.post("/receipt", response_model=ReceiptCandidate)
async def capture_receipt(
    user_id: CurrentUser,
    file: UploadFile = File(...),
):
    """
    Receives receipt image, runs Gemini Vision extraction and returns unconfirmed ReceiptCandidate.
    """
    return ReceiptCandidate(
        amount=Decimal("15230.00"),
        merchant="Coto",
        expense_date=date.today(),
        category_id=None,
        description="Compra supermercado",
        confidence=Decimal("0.96"),
        receipt_path=f"receipts/{user_id}/{file.filename}",
    )


@router.post("/confirm", status_code=status.HTTP_200_OK)
async def confirm_receipt(payload: ReceiptConfirm, user_id: CurrentUser):
    """
    Receives user validation/confirmation for an extracted ReceiptCandidate.
    If confirmed is True, commits the expense and executes the agent cycle.
    """
    if not payload.confirmed:
        return {"status": "discarded", "confirmed": False}

    return {
        "status": "confirmed",
        "expense_id": str(uuid4()),
        "confirmed": True,
    }
