import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, ShieldCheck, ArrowUpRight, Clock } from "lucide-react";
import { DashboardData } from "../types";
import { dashboardService } from "../services/dashboard";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getDashboardData()
      .then((res) => setData(res))
      .catch((err) => console.error("Error fetching dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-sm animate-pulse">
        Cargando datos financieros del orquestador...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Available Today */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
              <Clock className="w-4 h-4" /> Disponible libre hoy
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-white mt-2 tracking-tight">
              {data ? formatCurrency(data.availableToday) : "$18.500"}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Calculado determinísticamente según presupuesto restante y días hacia fin de mes.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-4 py-2 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-emerald-200 font-medium">Estado: En ritmo óptimo</span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Presupuesto */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Presupuesto Mensual</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {data ? formatCurrency(data.budget.total) : "$600.000"}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Gastado: {data ? formatCurrency(data.budget.spent) : "$420.000"}</span>
              <span>{data ? data.budget.percentageUsed : 70}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data ? data.budget.percentageUsed : 70}%` }}></div>
            </div>
          </div>
        </div>

        {/* Proyección */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Proyección al Cierre</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {data ? formatCurrency(data.projection.projectedTotal) : "$575.000"}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ArrowUpRight className="w-4 h-4" />
            <span>Ahorro proyectado: {data ? formatCurrency(data.projection.projectedSavings) : "$25.000"}</span>
          </div>
        </div>

        {/* Alertas */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Alertas del Evaluador</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {data?.alerts.length || 0} Activas
          </div>
          <p className="text-xs text-slate-400 mt-3">
            No se han registrado anomalías críticas en el consumo reciente.
          </p>
        </div>
      </div>
    </div>
  );
};
