import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Sparkles,
  BarChart2,
  Activity,
  ArrowDownRight,
} from "lucide-react";
import { DashboardData, DashboardChartsData } from "../types";
import { dashboardService } from "../services/dashboard";
import { CategoryBreakdownChart, SpendingPaceChart } from "../components/charts";
import { AlertItem } from "../components/alerts";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartsData, setChartsData] = useState<DashboardChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      dashboardService.getDashboardData(),
      dashboardService.getChartData(),
    ])
      .then(([dash, charts]) => {
        setData(dash);
        setChartsData(charts);
      })
      .catch((err) => {
        console.error("Error fetching dashboard:", err);
        setError("No se pudieron cargar los datos financieros del servidor.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-sm animate-pulse space-y-3">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
        <span>Calculando métricas deterministas y proyecciones del mes…</span>
      </div>
    );
  }

  const statusConfig = {
    on_track: {
      label: "En ritmo óptimo",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      badge: "bg-emerald-950/60 border-emerald-500/30 text-emerald-200",
    },
    warning: {
      label: "Consumo acelerado",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      badge: "bg-amber-950/60 border-amber-500/30 text-amber-200",
    },
    over_budget: {
      label: "Riesgo de sobrepaso",
      icon: <ArrowDownRight className="w-4 h-4 text-red-400" />,
      badge: "bg-red-950/60 border-red-500/30 text-red-200",
    },
  };

  const statusKey = data?.projection.status || "on_track";
  const currentStatus = statusConfig[statusKey];

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center justify-between text-red-200 text-xs">
          <span>{error}</span>
          <button
            onClick={loadDashboard}
            className="underline font-semibold hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Top Banner: Available Today */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
              <Clock className="w-4 h-4" /> Disponible libre hoy
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-white mt-2 tracking-tight">
              {data ? formatCurrency(data.available_today) : "$0"}
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-xl">
              {data?.meta ? (
                <>
                  Presupuesto libre dividido en{" "}
                  <strong className="text-slate-200">{data.meta.remaining_days} días restantes</strong> de mes
                  {data.meta.pending_fixed_expenses > 0 && (
                    <> (reservando {formatCurrency(data.meta.pending_fixed_expenses)} para gastos fijos pendientes)</>
                  )}.
                </>
              ) : (
                "Calculado determinísticamente según presupuesto restante y días hacia fin de mes."
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${currentStatus.badge}`}>
              {currentStatus.icon}
              <span className="text-xs font-semibold">{currentStatus.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Presupuesto */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Presupuesto Mensual</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">
              {data ? formatCurrency(data.budget.total) : "$0"}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Gastado: {data ? formatCurrency(data.budget.spent) : "$0"}</span>
              <span className="font-semibold text-slate-300">
                {data ? Math.round(data.budget.percentage_used) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (data?.budget.percentage_used || 0) > 90
                    ? "bg-red-500"
                    : (data?.budget.percentage_used || 0) > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, data ? data.budget.percentage_used : 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Restante: <strong className="text-slate-300">{data ? formatCurrency(data.budget.remaining) : "$0"}</strong>
            </p>
          </div>
        </div>

        {/* Proyección */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Proyección de Cierre</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">
              {data ? formatCurrency(data.projection.projected_total) : "$0"}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {data && data.projection.projected_savings > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ArrowUpRight className="w-4 h-4 shrink-0" />
                <span>Ahorro proyectado: {formatCurrency(data.projection.projected_savings)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                <ArrowDownRight className="w-4 h-4 shrink-0" />
                <span>Sin margen de ahorro proyectado</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Estimado según velocidad de consumo observada.
            </p>
          </div>
        </div>

        {/* Alertas Activas */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Alertas del Evaluador</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">
              {data?.alerts.length || 0} Activas
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            {(data?.alerts.length || 0) > 0
              ? "Revisá las recomendaciones y proporcioná feedback para entrenar el Meta-Agente."
              : "Consumo dentro de los parámetros esperados."}
          </p>
        </div>
      </div>

      {/* Visual Analytics with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Breakdown */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Gasto por Categoría</h3>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mes Actual</span>
          </div>
          <CategoryBreakdownChart data={chartsData?.categories || []} />
        </div>

        {/* Chart 2: Spending Pace Timeline */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-slate-100">Velocidad de Consumo Temporal</h3>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Curva Real vs Ideal</span>
          </div>
          <SpendingPaceChart data={chartsData?.timeline || []} />
        </div>
      </div>

      {/* Active Alerts List with Meta-Agent Feedback */}
      {data && data.alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Recomendaciones y Alertas de Agentes</span>
          </div>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
