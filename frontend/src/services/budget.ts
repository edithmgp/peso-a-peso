import { fetchApi } from "./api";
import { Budget, BudgetCreatePayload } from "../types";

export const budgetService = {
  async getCurrentBudget(): Promise<Budget | null> {
    try {
      return await fetchApi<Budget>("/budget/current");
    } catch (err: any) {
      if (err?.message?.includes("404") || err?.message?.includes("No budget")) return null;
      throw err;
    }
  },

  async createBudget(payload: BudgetCreatePayload): Promise<Budget> {
    return fetchApi<Budget>("/budget", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateBudget(budgetId: string, amount: number): Promise<Budget> {
    return fetchApi<Budget>(`/budget/${budgetId}`, {
      method: "PUT",
      body: JSON.stringify({ amount }),
    });
  },
};
