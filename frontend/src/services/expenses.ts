import { fetchApi } from "./api";
import { Expense, ExpenseCreatePayload } from "../types";

export const expensesService = {
  async listExpenses(from?: string, to?: string, categoryId?: string): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (categoryId) params.set("category_id", categoryId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchApi<Expense[]>(`/expenses${query}`);
  },

  async createExpense(payload: ExpenseCreatePayload): Promise<Expense> {
    return fetchApi<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getExpense(id: string): Promise<Expense> {
    return fetchApi<Expense>(`/expenses/${id}`);
  },

  async updateExpense(id: string, data: Partial<ExpenseCreatePayload>): Promise<Expense> {
    return fetchApi<Expense>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    return fetchApi<void>(`/expenses/${id}`, { method: "DELETE" });
  },
};
