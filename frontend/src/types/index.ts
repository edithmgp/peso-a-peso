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

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  description?: string;
  merchant?: string;
  expenseDate: string;
  source: ExpenseSource;
  confidence?: number;
  confirmed: boolean;
  receiptPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreatePayload {
  amount: number;
  description?: string;
  merchant?: string;
  expenseDate: string;
  categoryId: string;
  source?: ExpenseSource;
}

export interface Budget {
  id: string;
  userId: string;
  month: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  total: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
}

export interface ProjectionSummary {
  projectedTotal: number;
  projectedSavings: number;
  status: ProjectionStatus;
}

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  categoryId?: string;
  agentSource: string;
  createdAt: string;
  seenAt?: string;
}

export interface DashboardData {
  availableToday: number;
  budget: BudgetSummary;
  projection: ProjectionSummary;
  alerts: Alert[];
}

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
