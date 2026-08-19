import { useState, useEffect } from "react";
import { PlusCircle, Camera, MessageSquare, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { categoriesService } from "../services/categories";
import { expensesService } from "../services/expenses";
import { Category } from "../types";

type Tab = "manual" | "text" | "ocr";

export const AddExpense: React.FC = () => {
  const [tab, setTab] = useState<Tab>("manual");

  // Categories loaded from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    categoriesService
      .listCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setMerchant("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    setSubmitting(true);
    setError(null);
    setSuccessId(null);

    try {
      const expense = await expensesService.createExpense({
        amount: parseFloat(amount),
        description: description || undefined,
        merchant: merchant || undefined,
        expense_date: expenseDate,
        category_id: categoryId,
        source: "manual",
      });
      setSuccessId(expense.id);
      resetForm();
      // Clear success message after 4 seconds
      setTimeout(() => setSuccessId(null), 4000);
    } catch (err: any) {
      setError(err?.message || "No se pudo registrar el gasto. Verificá la conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      id={`tab-${t}`}
      type="button"
      onClick={() => setTab(t)}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
        tab === t ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mode Tabs */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        {tabBtn("manual", <PlusCircle className="w-4 h-4" />, "Manual")}
        {tabBtn("text", <MessageSquare className="w-4 h-4" />, "Texto / IA")}
        {tabBtn("ocr", <Camera className="w-4 h-4" />, "Ticket OCR")}
      </div>

      {/* Success Banner */}
      {successId && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-start gap-3 text-emerald-200 text-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">¡Gasto registrado exitosamente!</p>
            <p className="text-emerald-400 mt-0.5 font-mono">ID: {successId.slice(0, 18)}…</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Manual Form ── */}
      {tab === "manual" && (
        <form id="form-add-expense-manual" onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto ($) <span className="text-red-400">*</span>
            </label>
            <input
              id="input-amount"
              type="number"
              required
              min="1"
              step="0.01"
              placeholder="Ej: 15200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-lg font-bold focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Comercio</label>
            <input
              id="input-merchant"
              type="text"
              placeholder="Ej: Supermercado Coto"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Categoría <span className="text-red-400">*</span>
            </label>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando categorías…
              </div>
            ) : (
              <select
                id="select-category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Fecha del gasto</label>
            <input
              id="input-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Descripción</label>
            <textarea
              id="input-description"
              placeholder="Ej: Compra mensual de insumos"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <button
            id="btn-submit-expense"
            type="submit"
            disabled={submitting || categoriesLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registrando…
              </>
            ) : (
              "Registrar y Analizar Gasto"
            )}
          </button>
        </form>
      )}

      {/* ── Natural Language ── */}
      {tab === "text" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
            🚀 <strong>Sprint 6</strong> — La captura por lenguaje natural con Gemini se implementa en el Sprint de IA.
          </div>
          <p className="text-xs text-slate-400">
            Escribí libremente el gasto y el <strong>Agente de Captura + Gemini</strong> extraerá los campos.
          </p>
          <textarea
            id="input-text-capture"
            placeholder='Ej: "Gasté $15.000 en Coto comprando carne y verduras"'
            rows={4}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-4 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 resize-none"
          />
          <button
            disabled
            className="w-full py-3 bg-slate-700 cursor-not-allowed text-slate-400 font-bold rounded-xl text-sm"
          >
            Procesar con IA (próximamente)
          </button>
        </div>
      )}

      {/* ── OCR ── */}
      {tab === "ocr" && (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Subir Fotografía de Ticket</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Gemini Vision extraerá los datos y te solicitará confirmación humana antes de persistir.
            </p>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
            🚀 <strong>Sprint 6</strong> — OCR con Gemini Vision se implementa en el Sprint de IA.
          </div>
          <input
            id="input-receipt-file"
            type="file"
            accept="image/*"
            disabled
            className="text-xs text-slate-500 mx-auto cursor-not-allowed"
          />
        </div>
      )}
    </div>
  );
};
