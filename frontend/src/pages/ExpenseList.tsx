import { useState, useEffect } from "react";
import { Receipt, Trash2, Loader2, AlertCircle, PlusCircle, Calendar, Tag } from "lucide-react";
import { expensesService } from "../services/expenses";
import { Expense } from "../types";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  utilities: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  transport: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  leisure: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  housing: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  health: "bg-green-500/15 text-green-300 border-green-500/30",
  education: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  other: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export const ExpenseList: React.FC = () => {
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    expensesService
      .listExpenses(fromDate, toDate)
      .then(setExpenses)
      .catch((e) => setError(e?.message || "Error al cargar gastos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [fromDate, toDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    setDeletingId(id);
    try {
      await expensesService.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e?.message || "No se pudo eliminar el gasto.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalShown = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" /> Gastos Registrados
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {loading ? "Cargando…" : `${expenses.length} gastos · Total: ${formatCurrency(totalShown)}`}
          </p>
        </div>
        {/* Date Filters */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-2">
          <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            id="filter-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none"
          />
          <span className="text-slate-600">—</span>
          <input
            id="filter-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 border border-slate-800 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-32" />
                  <div className="h-2 bg-slate-800 rounded w-20" />
                </div>
                <div className="h-6 bg-slate-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && expenses.length === 0 && (
        <div className="glass-panel rounded-3xl p-12 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
            <Receipt className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-300 font-semibold">Sin gastos en el período</p>
            <p className="text-slate-500 text-sm mt-1">Cambiá el rango de fechas o registrá tu primer gasto.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
            <PlusCircle className="w-4 h-4" />
            <span>Usá "Registrar" en el menú</span>
          </div>
        </div>
      )}

      {/* Expense Cards */}
      {!loading && expenses.length > 0 && (
        <div className="space-y-3">
          {expenses.map((exp) => {
            const slug = exp.categories?.slug || "other";
            const catName = exp.categories?.name || exp.category_id.slice(0, 8);
            const colorClass = CATEGORY_COLORS[slug] || CATEGORY_COLORS.other;

            return (
              <div
                key={exp.id}
                className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                        <Tag className="w-2.5 h-2.5" /> {catName}
                      </span>
                      {exp.merchant && (
                        <span className="text-xs text-slate-300 font-medium truncate">{exp.merchant}</span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{exp.description}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(exp.expense_date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-lg font-bold text-slate-100">{formatCurrency(Number(exp.amount))}</span>
                    <button
                      id={`btn-delete-${exp.id}`}
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-30"
                    >
                      {deletingId === exp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {!loading && expenses.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total período</span>
          <span className="text-xl font-extrabold text-emerald-300">{formatCurrency(totalShown)}</span>
        </div>
      )}
    </div>
  );
};
