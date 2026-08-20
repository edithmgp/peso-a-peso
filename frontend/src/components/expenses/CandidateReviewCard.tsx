import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Trash2,
  Loader2,
  ShieldCheck,
  Calendar,
  DollarSign,
  Tag,
  Building,
  FileText,
} from "lucide-react";
import { Category, ReceiptCandidate, Expense } from "../../types";
import { captureService, CandidateConfirmPayload } from "../../services/capture";

interface Props {
  candidate: ReceiptCandidate;
  categories: Category[];
  source: "text" | "ocr";
  onSuccess: (created: Expense) => void;
  onDiscard: () => void;
}

export const CandidateReviewCard: React.FC<Props> = ({
  candidate,
  categories,
  source,
  onSuccess,
  onDiscard,
}) => {
  const [amount, setAmount] = useState<string>(candidate.amount ? String(candidate.amount) : "");
  const [merchant, setMerchant] = useState<string>(candidate.merchant || "");
  const [expenseDate, setExpenseDate] = useState<string>(
    candidate.expenseDate || new Date().toISOString().split("T")[0]
  );
  const [categoryId, setCategoryId] = useState<string>(
    candidate.categoryId || (categories.length > 0 ? categories[0].id : "")
  );
  const [description, setDescription] = useState<string>(candidate.description || "");

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confidencePct = Math.round((candidate.confidence || 0.90) * 100);

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }
    if (!categoryId) {
      setError("Seleccioná una categoría.");
      return;
    }

    setConfirming(true);
    setError(null);
    try {
      const payload: CandidateConfirmPayload = {
        amount: numAmount,
        category_id: categoryId,
        expense_date: expenseDate,
        merchant: merchant || undefined,
        description: description || undefined,
        source,
        confidence: candidate.confidence,
        receipt_path: candidate.receiptPath,
      };

      const created = await captureService.confirmCandidate(payload);
      onSuccess(created);
    } catch (e: any) {
      setError(e?.message || "No se pudo confirmar el gasto.");
      setConfirming(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-teal-500/40 bg-slate-900/90 shadow-xl space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Datos Extraídos por Gemini ({source === "ocr" ? "Vision OCR" : "Lenguaje Natural"})
            </h3>
            <p className="text-[11px] text-slate-400">
              Revisá y ajustá los campos antes de confirmar el registro.
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-950/60 border border-teal-500/30 rounded-xl text-teal-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>{confidencePct}% confianza</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Editable Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monto ($) *
          </label>
          <input
            type="number"
            required
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-base font-bold focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Building className="w-3.5 h-3.5 text-cyan-400" /> Comercio / Proveedor
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Ej: Coto, Edenor, Uber"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-purple-400" /> Categoría *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Fecha del Gasto
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={confirming}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Descartar
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-2 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
        >
          {confirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirmando y ejecutando ciclo OODA…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Registrar Gasto</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
