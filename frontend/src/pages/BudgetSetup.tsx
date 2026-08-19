import { useState, useEffect } from "react";
import { Wallet, CheckCircle2, Loader2, AlertCircle, PencilLine, Save } from "lucide-react";
import { budgetService } from "../services/budget";
import { Budget } from "../types";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

const currentMonthStart = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), 1).toISOString().split("T")[0];
};

const MONTH_LABELS: Record<number, string> = {
  0: "Enero", 1: "Febrero", 2: "Marzo", 3: "Abril",
  4: "Mayo", 5: "Junio", 6: "Julio", 7: "Agosto",
  8: "Septiembre", 9: "Octubre", 10: "Noviembre", 11: "Diciembre",
};

export const BudgetSetup: React.FC = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [amountInput, setAmountInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = new Date();
  const monthLabel = `${MONTH_LABELS[today.getMonth()]} ${today.getFullYear()}`;

  useEffect(() => {
    budgetService
      .getCurrentBudget()
      .then((b) => {
        setBudget(b);
        if (b) setAmountInput(String(b.amount));
      })
      .catch((e) => setError(e?.message || "Error al cargar presupuesto"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;

    setSaving(true);
    setError(null);
    try {
      let result: Budget;
      if (budget) {
        result = await budgetService.updateBudget(budget.id, amount);
      } else {
        result = await budgetService.createBudget({ month: currentMonthStart(), amount });
      }
      setBudget(result);
      setAmountInput(String(result.amount));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("409") || msg.includes("already exists")) {
        setError("Ya existe un presupuesto para este mes. Recargá la página.");
      } else {
        setError(msg || "No se pudo guardar el presupuesto.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando presupuesto…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Wallet className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Presupuesto Mensual</h2>
          <p className="text-xs text-slate-400">{monthLabel}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Saved Banner */}
      {saved && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          Presupuesto guardado exitosamente.
        </div>
      )}

      {/* Current Budget Display */}
      {budget && !editing && (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Presupuesto configurado</p>
          <div className="text-5xl font-extrabold text-emerald-300 tracking-tight">
            {formatCurrency(Number(budget.amount))}
          </div>
          <p className="text-xs text-slate-500">Período: {monthLabel}</p>
          <button
            id="btn-edit-budget"
            onClick={() => { setEditing(true); setAmountInput(String(budget.amount)); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-slate-700"
          >
            <PencilLine className="w-4 h-4" /> Modificar monto
          </button>
        </div>
      )}

      {/* Form (create or edit) */}
      {(!budget || editing) && (
        <form
          id="form-budget-setup"
          onSubmit={handleSave}
          className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {budget ? "Nuevo monto" : "Monto del presupuesto"} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">$</span>
              <input
                id="input-budget-amount"
                type="number"
                required
                min="1"
                step="1"
                placeholder="600000"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-3.5 text-slate-100 text-2xl font-bold focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Este monto representa el presupuesto total para <strong className="text-slate-400">{monthLabel}</strong>.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {[300000, 500000, 600000, 800000, 1000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountInput(String(preset))}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                  amountInput === String(preset)
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-slate-700"
              >
                Cancelar
              </button>
            )}
            <button
              id="btn-save-budget"
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              ) : (
                <><Save className="w-4 h-4" /> {budget ? "Actualizar presupuesto" : "Confirmar presupuesto"}</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Info box */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-500 space-y-1">
        <p>📊 El <strong className="text-slate-400">disponible diario</strong> se calcula automáticamente a partir del presupuesto restante dividido los días que faltan al cierre del mes.</p>
        <p>📌 Los gastos fijos de <strong className="text-slate-400">prioridad alta</strong> se descuentan primero del presupuesto disponible.</p>
      </div>
    </div>
  );
};
