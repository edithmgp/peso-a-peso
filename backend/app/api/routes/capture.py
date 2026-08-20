"""
Intelligent Ingestion & Gemini Capture Endpoints (/api/v1/capture)
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.dependencies import CurrentUser
from app.schemas.capture import TextCaptureRequest, CandidateConfirmRequest
from app.schemas.expense import ExpenseResponse, ExpenseCreate, ReceiptCandidate
from app.schemas.agents import AgentContext
from app.services.gemini_service import GeminiService
from app.services.category_service import CategoryService
from app.services.expense_service import ExpenseService
from app.orchestrator.orchestrator import orchestrator

router = APIRouter(prefix="/capture", tags=["Capture & Ingestion"])


@router.post("/text", response_model=ReceiptCandidate)
async def capture_from_text(
    payload: TextCaptureRequest,
    user_id: CurrentUser,
):
    """
    Extracts expense details from free natural language text using Gemini 2.0.
    Returns an unconfirmed candidate for human review and confirmation.
    """
    categories = await CategoryService.get_all()
    extracted = await GeminiService.extract_from_text(payload.text, categories)

    return ReceiptCandidate(
        amount=Decimal(str(extracted["amount"])) if extracted["amount"] > 0 else None,
        merchant=extracted.get("merchant"),
        expense_date=extracted.get("expense_date"),
        category_id=UUID(extracted["category_id"]) if extracted.get("category_id") else None,
        description=extracted.get("description"),
        confidence=Decimal(str(extracted["confidence"])),
        receipt_path="",
    )


@router.post("/receipt", response_model=ReceiptCandidate)
async def capture_receipt(
    user_id: CurrentUser,
    file: UploadFile = File(...),
):
    """
    Receives receipt image, runs Gemini Vision OCR extraction,
    and returns an unconfirmed ReceiptCandidate for human review.
    """
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    filename = file.filename or "receipt.jpg"

    categories = await CategoryService.get_all()
    extracted = await GeminiService.extract_from_receipt(
        file_bytes=file_bytes,
        mime_type=mime_type,
        filename=filename,
        categories=categories,
    )

    return ReceiptCandidate(
        amount=Decimal(str(extracted["amount"])) if extracted["amount"] > 0 else None,
        merchant=extracted.get("merchant"),
        expense_date=extracted.get("expense_date"),
        category_id=UUID(extracted["category_id"]) if extracted.get("category_id") else None,
        description=extracted.get("description"),
        confidence=Decimal(str(extracted["confidence"])),
        receipt_path=extracted.get("receipt_path", f"receipts/{filename}"),
    )


@router.post("/confirm", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def confirm_candidate(
    payload: CandidateConfirmRequest,
    user_id: CurrentUser,
):
    """
    Human-in-the-Loop confirmation: Commits the user-reviewed candidate to Supabase,
    and triggers the full multi-agent OODA pipeline.
    """
    create_payload = ExpenseCreate(
        amount=payload.amount,
        description=payload.description,
        merchant=payload.merchant,
        expense_date=payload.expense_date,
        category_id=payload.category_id,
        source=payload.source,
    )

    result = await ExpenseService.create_expense(user_id, create_payload)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to commit confirmed expense.",
        )

    expense_obj = ExpenseResponse.model_validate(result)

    # Trigger multi-agent OODA pipeline
    context = AgentContext(
        request_id=uuid4(),
        user_id=user_id,
        expense=expense_obj,
    )
    await orchestrator.run_expense_cycle(context)

    return expense_obj
