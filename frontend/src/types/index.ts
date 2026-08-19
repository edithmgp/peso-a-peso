/**
 * TypeScript Data Models and Contracts (v1.3)
 */

export type ExpenseSource = "manual" | "text" | "ocr";
export type AlertSeverity = "info" | "warning" | "critical";
export type RiskLevel = "low" | "medium" | "high";
export type ProjectionStatus = "on_track" | "warning" | "over_budget";
export type FeedbackType = "useful" | "not_useful";
export type AgentTone = "neutral" | "friendly" | "direct";
export type AlertFrequency = "low" | "normal" | "high";
export type FixedExpensePriority = "low" | "normal" | "high";

// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
}

// ── Expense ───────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description?: string;
  merchant?: string;
  expense_date: string;
  source: ExpenseSource;
  confidence?: number;
  confirmed: boolean;
  receipt_path?: string;
  created_at: string;
  updated_at: string;
  // Optional nested category (when backend joins)
  categories?: Category;
}

/** Payload sent to POST /api/v1/expenses — uses snake_case to match FastAPI contract */
export interface ExpenseCreatePayload {
  amount: number;
  description?: string;
  merchant?: string;
  expense_date: string;
  category_id: string;
  source?: ExpenseSource;
}

// ── Budget ────────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  user_id: string;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreatePayload {
  month: string;
  amount: number;
}

export interface BudgetSummary {
  total: number;
  spent: number;
  remaining: number;
  percentage_used: number;
}

export interface ProjectionSummary {
  projected_total: number;
  projected_savings: number;
  status: ProjectionStatus;
}

// ── Fixed Expenses ─────────────────────────────────────────────────────────────

export interface FixedExpense {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  expected_amount: number;
  due_day: number;
  priority: FixedExpensePriority;
  active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface FixedExpenseCreatePayload {
  name: string;
  category_id: string;
  expected_amount: number;
  due_day: number;
  priority?: FixedExpensePriority;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  category_id?: string;
  agent_source: string;
  created_at: string;
  seen_at?: string;
}

// ── Dashboard & Charts ─────────────────────────────────────────────────────────

export interface DashboardMeta {
  days_in_month: number;
  days_passed: number;
  remaining_days: number;
  pending_fixed_expenses: number;
}

export interface DashboardData {
  available_today: number;
  budget: BudgetSummary;
  projection: ProjectionSummary;
  alerts: Alert[];
  meta?: DashboardMeta;
}

export interface CategorySpendingItem {
  slug: string;
  name: string;
  amount: number;
}

export interface TimelinePoint {
  day: number;
  label: string;
  ideal: number;
  actual: number | null;
  daily_spent: number;
}

export interface DashboardChartsData {
  categories: CategorySpendingItem[];
  timeline: TimelinePoint[];
}

// ── Analysis & Agents ─────────────────────────────────────────────────────────

export interface FinancialAnalysis {
  dailyAverage: number;
  categoryAverage: number;
  categoryDeviation: number;
  spendingVelocity: number;
  anomalyDetected: boolean;
  anomalyScore: number;
  riskLevel: RiskLevel;
}

export interface FinancialProjection {
  remainingBudget: number;
  remainingDays: number;
  availablePerDay: number;
  projectedMonthlySpending: number;
  projectedSavings: number;
  budgetRisk: RiskLevel;
}

export interface BehaviorProfile {
  preferredTone: AgentTone;
  alertFrequency: AlertFrequency;
  categoryScores: Record<string, number>;
}

export interface ReceiptCandidate {
  amount?: number;
  merchant?: string;
  expenseDate?: string;
  categoryId?: string;
  description?: string;
  confidence: number;
  receiptPath: string;
}
