"""
Pydantic Schemas Package (Contracts v1.3)
"""

from app.schemas.expense import ExpenseBase, ExpenseCreate, ExpenseUpdate, ExpenseResponse, ReceiptCandidate, ReceiptConfirm
from app.schemas.budget import BudgetBase, BudgetCreate, BudgetUpdate, BudgetResponse
from app.schemas.dashboard import DashboardResponse, BudgetSummary, ProjectionSummary
from app.schemas.analysis import FinancialAnalysis, FinancialProjection
from app.schemas.alert import AlertResponse, AlertFeedbackCreate
from app.schemas.agents import AgentContext, AgentResult, BehaviorProfile

__all__ = [
    "ExpenseBase",
    "ExpenseCreate",
    "ExpenseUpdate",
    "ExpenseResponse",
    "ReceiptCandidate",
    "ReceiptConfirm",
    "BudgetBase",
    "BudgetCreate",
    "BudgetUpdate",
    "BudgetResponse",
    "DashboardResponse",
    "BudgetSummary",
    "ProjectionSummary",
    "FinancialAnalysis",
    "FinancialProjection",
    "AlertResponse",
    "AlertFeedbackCreate",
    "AgentContext",
    "AgentResult",
    "BehaviorProfile",
]
