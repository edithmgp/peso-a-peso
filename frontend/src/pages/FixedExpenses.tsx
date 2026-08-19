import { useState, useEffect } from "react";
import { CalendarClock, Trash2, Loader2, AlertCircle, PlusCircle, Shield, Zap, Minus } from "lucide-react";
import { fixedExpensesService } from "../services/fixed_expenses";
import { categoriesService } from "../services/categories";
import { FixedExpense, Category, FixedExpensePriority } from "../types";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

const PRIORITY_CONFIG: Record<FixedExpensePriority, { label: string; icon: React.ReactNode; class: string }> = {
  high: {
    label: "Alta",
    icon: <Shield className="w-3 h-3" />,
    class: "bg-red-500/15 text-red-300 border-red-500/30",
  },
  normal: {
    label: "Normal",
    icon: <Zap className="w-3 h-3" />,
    class: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  low: {
    label: "Baja",
    icon: <Minus className="w-3 h-3" />,
    class: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
};

export const FixedExpenses: React.FC = () => {
  const [items, setItems] = useState<FixedExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [priority, setPriority] = useState<FixedExpensePriority>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fixedExpensesService.list(false), // include inactive too
      categoriesService.listCategories(),
    ])
      .then(([fe, cats]) => {
        setItems(fe);
        setCategories(cats);
        if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
      })
      .catch((e) => setError(e?.message || "Error al cargar gastos fijos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName("");
    setAmount("");
    setDueDay("1");
    setPriority("normal");
    if (categories.length > 0) setCategoryId(categories[0].id);
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !categoryId) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await fixedExpensesService.create({
        name,
        category_id: categoryId,
        expected_amount: parseFloat(amount),
        due_day: parseInt(dueDay),
        priority,
      });
      setItems((prev) => [...prev, created]);
      resetForm();
    } catch (e: any) {
      setError(e?.message || "No se pudo crear el gasto fijo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: FixedExpense) => {
    try {
      const updated = await fixedExpensesService.toggleActive(item.id, !item.active);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (e: any) {
      alert(e?.message || "Error al actualizar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto fijo?")) return;
    setDeletingId(id);
    try {
      await fixedExpensesService.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert(e?.message || "No se pudo eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  const active = items.filter((i) => i.active);
  const inactive = items.filter((i) => !i.active);
  const totalActive = active.reduce((s, i) => s + Number(i.expected_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-emerald-400" /> Gastos Fijos
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {active.length} activos · Total comprometido: <span className="text-emerald-300 font-semibold">{formatCurrency(totalActive)}</span>
          </p>
        </div>
        <button
          id="btn-add-fixed-expense"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
        >
          <PlusCircle className="w-4 h-4" /> Agregar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form
          id="form-add-fixed-expense"
          onSubmit={handleCreate}
          className="glass-panel rounded-2xl p-5 border border-emerald-500/20 space-y-4"
        >
          <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nuevo gasto fijo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1 font-medium">Nombre *</label>
              <input
                id="input-fixed-name"
                required
                placeholder="Ej: Alquiler, Luz, Netflix"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Monto esperado ($) *</label>
              <input
                id="input-fixed-amount"
                type="number"
                required
                min="1"
                placeholder="45000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Día de vencimiento *</label>
              <input
                id="input-fixed-due-day"
                type="number"
                required
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Categoría *</label>
              <select
                id="select-fixed-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Prioridad</label>
              <select
                id="select-fixed-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as FixedExpensePriority)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="high">Alta — se descuenta del disponible</option>
                <option value="normal">Normal</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : "Guardar gasto fijo"}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando gastos fijos…
        </div>
      )}

      {/* Active list */}
      {!loading && active.length === 0 && !showForm && (
        <div className="glass-panel rounded-3xl p-10 border border-slate-800 text-center space-y-3">
          <CalendarClock className="w-12 h-12 text-slate-700 mx-auto" />
          <p className="text-slate-400 font-medium">Sin gastos fijos configurados</p>
          <p className="text-slate-600 text-sm">Agregá servicios, alquileres o suscripciones recurrentes.</p>
        </div>
      )}

      {!loading && active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Activos ({active.length})</p>
          {active.map((item) => {
            const p = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
            return (
              <div key={item.id} className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all group flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{item.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.class}`}>
                      {p.icon} {p.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.categories?.name || "Sin categoría"} · Vence día {item.due_day}
                  </p>
                </div>
                <span className="text-base font-bold text-slate-200 shrink-0">{formatCurrency(Number(item.expected_amount))}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    id={`btn-toggle-${item.id}`}
                    onClick={() => handleToggle(item)}
                    title="Desactivar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 transition-all text-xs"
                  >
                    ⏸
                  </button>
                  <button
                    id={`btn-delete-fixed-${item.id}`}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-30"
                  >
                    {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inactive */}
      {!loading && inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Inactivos ({inactive.length})</p>
          {inactive.map((item) => (
            <div key={item.id} className="rounded-2xl p-4 border border-slate-800/50 flex items-center gap-4 opacity-50 hover:opacity-70 transition-all group">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-400 line-through">{item.name}</span>
                <p className="text-xs text-slate-600">{formatCurrency(Number(item.expected_amount))} · día {item.due_day}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  id={`btn-activate-${item.id}`}
                  onClick={() => handleToggle(item)}
                  title="Reactivar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs"
                >
                  ▶
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-30"
                >
                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
