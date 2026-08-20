import { fetchApi } from "./api";
import { ReceiptCandidate, Expense } from "../types";

export interface CandidateConfirmPayload {
  amount: number;
  category_id: string;
  expense_date: string;
  merchant?: string;
  description?: string;
  source: "text" | "ocr";
  confidence?: number;
  receipt_path?: string;
}

export const captureService = {
  async captureFromText(text: string): Promise<ReceiptCandidate> {
    return fetchApi<ReceiptCandidate>("/capture/text", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  async captureFromReceipt(file: File): Promise<ReceiptCandidate> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("auth_token") || "dev-token";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const apiBase =
      import.meta.env.VITE_API_URL?.replace(/\/$/, "") ??
      "http://localhost:8000/api/v1";

    const res = await fetch(`${apiBase}/capture/receipt`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Error al procesar el ticket con OCR");
    }

    return res.json();
  },

  async confirmCandidate(payload: CandidateConfirmPayload): Promise<Expense> {
    return fetchApi<Expense>("/capture/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
