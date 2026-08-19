import { fetchApi } from "./api";
import { FixedExpense, FixedExpenseCreatePayload } from "../types";

export const fixedExpensesService = {
  async list(activeOnly = true): Promise<FixedExpense[]> {
    return fetchApi<FixedExpense[]>(`/fixed-expenses?active_only=${activeOnly}`);
  },

  async create(payload: FixedExpenseCreatePayload): Promise<FixedExpense> {
    return fetchApi<FixedExpense>("/fixed-expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, data: Partial<FixedExpenseCreatePayload & { active: boolean }>): Promise<FixedExpense> {
    return fetchApi<FixedExpense>(`/fixed-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string): Promise<void> {
    return fetchApi<void>(`/fixed-expenses/${id}`, { method: "DELETE" });
  },

  async toggleActive(id: string, active: boolean): Promise<FixedExpense> {
    return fetchApi<FixedExpense>(`/fixed-expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify({ active }),
    });
  },
};
