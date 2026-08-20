import { useState, useEffect } from "react";
import {
  PlusCircle,
  Camera,
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  Upload,
} from "lucide-react";
import { categoriesService } from "../services/categories";
import { expensesService } from "../services/expenses";
import { captureService } from "../services/capture";
import { Category, ReceiptCandidate, Expense } from "../types";
import { CandidateReviewCard } from "../components/expenses/CandidateReviewCard";

type Tab = "manual" | "text" | "ocr";

const SAMPLE_PROMPTS = [
  "Gasté $15.000 en Coto comprando carne y verduras",
  "Pagué $32.500 de luz Edenor",
  "Viaje en Uber por $8.400",
  "Cena en La Cabrera por $45.000 ayer",
];

export const AddExpense: React.FC = () => {
  const [tab, setTab] = useState<Tab>("manual");

  // Categories loaded from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Manual Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  // AI Text state
  const [aiText, setAiText] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);

  // OCR state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // Extracted Candidate (Human-in-the-loop)
  const [activeCandidate, setActiveCandidate] = useState<{
    candidate: ReceiptCandidate;
    source: "text" | "ocr";
  } | null>(null);

  // Submit / Notification state
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

  const resetManualForm = () => {
    setAmount("");
    setDescription("");
    setMerchant("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setError(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
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
      resetManualForm();
      setTimeout(() => setSuccessId(null), 5000);
    } catch (err: any) {
      setError(err?.message || "No se pudo registrar el gasto. Verificá la conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessText = async () => {
    if (!aiText.trim()) return;
    setAiProcessing(true);
    setError(null);
    try {
      const candidate = await captureService.captureFromText(aiText);
      setActiveCandidate({ candidate, source: "text" });
    } catch (err: any) {
      setError(err?.message || "Error al procesar el texto con Gemini.");
    } finally {
      setAiProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) return;
    setOcrProcessing(true);
    setError(null);
    try {
      const candidate = await captureService.captureFromReceipt(selectedFile);
      setActiveCandidate({ candidate, source: "ocr" });
    } catch (err: any) {
      setError(err?.message || "Error al procesar la imagen del ticket con OCR.");
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleCandidateSuccess = (created: Expense) => {
    setActiveCandidate(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiText("");
    setSuccessId(created.id);
    setTimeout(() => setSuccessId(null), 5000);
  };

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      id={`tab-${t}`}
      type="button"
      onClick={() => {
        setTab(t);
        setActiveCandidate(null);
        setError(null);
      }}
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
          <div className="space-y-1">
            <p className="font-bold text-emerald-300">¡Gasto registrado y procesado!</p>
            <p className="text-[11px] text-slate-300">
              Ciclo OODA ejecutado: <strong className="text-emerald-400">Captura ➔ Analizador ➔ Planificador ➔ Evaluador</strong>.
            </p>
            <p className="text-emerald-400 font-mono text-[10px]">ID: {successId.slice(0, 18)}…</p>
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

      {/* Human-in-the-loop Review Card (Shown when candidate is extracted) */}
      {activeCandidate && (
        <CandidateReviewCard
          candidate={activeCandidate.candidate}
          categories={categories}
          source={activeCandidate.source}
          onSuccess={handleCandidateSuccess}
          onDiscard={() => setActiveCandidate(null)}
        />
      )}

      {/* ── Mode 1: Manual Form ── */}
      {tab === "manual" && !activeCandidate && (
        <form
          id="form-add-expense-manual"
          onSubmit={handleManualSubmit}
          className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4"
        >
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Comercio
            </label>
            <input
              id="input-merchant"
              type="text"
              placeholder="Ej: Supermercado Coto"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Fecha del gasto
            </label>
            <input
              id="input-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              id="input-description"
              placeholder="Ej: Compra semanal de verduras"
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

      {/* ── Mode 2: Natural Language AI ── */}
      {tab === "text" && !activeCandidate && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ingesta por Lenguaje Natural (Gemini 2.0)</span>
            </div>
            <p className="text-xs text-slate-400">
              Escribí libremente el gasto y el <strong>Agente de Captura</strong> extraerá monto, comercio y categoría.
            </p>
          </div>

          {/* Quick example chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ejemplos rápidos:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setAiText(prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="input-text-capture"
            placeholder='Ej: "Gasté $15.000 en Coto comprando carne y verduras"'
            rows={4}
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-4 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 resize-none transition-colors"
          />

          <button
            id="btn-process-text"
            type="button"
            onClick={handleProcessText}
            disabled={aiProcessing || !aiText.trim()}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2"
          >
            {aiProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Extrayendo con Gemini 2.0…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Procesar con IA Gemini
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Mode 3: Ticket OCR Vision ── */}
      {tab === "ocr" && !activeCandidate && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Subir Fotografía de Ticket o Factura</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                Gemini Vision extraerá los datos del comprobante para tu confirmación interactiva.
              </p>
            </div>
          </div>

          {/* File input / Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/60">
            <input
              id="input-receipt-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="input-receipt-file" className="cursor-pointer block space-y-2">
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Ticket preview"
                    className="max-h-48 mx-auto rounded-xl border border-slate-700 object-contain shadow-lg"
                  />
                  <p className="text-xs text-emerald-400 font-medium">
                    {selectedFile?.name} (Click para cambiar imagen)
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">
                    Hacé click para seleccionar o arrastrá una foto de tu ticket
                  </p>
                  <p className="text-[10px] text-slate-500">Formatos soportados: JPG, PNG, WEBP</p>
                </div>
              )}
            </label>
          </div>

          <button
            id="btn-process-receipt"
            type="button"
            onClick={handleProcessReceipt}
            disabled={ocrProcessing || !selectedFile}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2"
          >
            {ocrProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analizando ticket con Gemini Vision…
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" /> Analizar Ticket con Gemini Vision
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
