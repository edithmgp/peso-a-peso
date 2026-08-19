import React, { useEffect, useState } from "react";
import {
  FlaskConical,
  BarChart3,
  LineChart,
  Sliders,
  Cpu,
} from "lucide-react";
import { DashboardData, DashboardChartsData } from "../types";
import { dashboardService } from "../services/dashboard";
import { CategoryBreakdownChart, SpendingPaceChart } from "../components/charts";
import { AgentEventsTrace } from "../components/laboratory/AgentEventsTrace";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(val);

export const Laboratory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"simulator" | "traces">("simulator");
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartsData, setChartsData] = useState<DashboardChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Scenario Simulator state
  const [budgetAdjustment, setBudgetAdjustment] = useState<number>(0); // -30% to +30%
  const [spendingCut, setSpendingCut] = useState<number>(0); // 0% to 30%

  useEffect(() => {
    Promise.all([
      dashboardService.getDashboardData(),
      dashboardService.getChartData(),
    ])
      .then(([dash, charts]) => {
        setData(dash);
        setChartsData(charts);
      })
      .catch((err) => console.error("Error loading laboratory data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-sm animate-pulse space-y-3">
        <FlaskConical className="w-8 h-8 text-teal-400 animate-bounce" />
        <span>Cargando modelos analíticos del Laboratorio Financiero…</span>
      </div>
    );
  }

  const baseBudget = Number(data?.budget.total || 0);
  const baseSpent = Number(data?.budget.spent || 0);
  const daysInMonth = data?.meta?.days_in_month || 30;
  const daysPassed = data?.meta?.days_passed || 1;
  const remainingDays = data?.meta?.remaining_days || (daysInMonth - daysPassed + 1);

  // Scenario calculations
  const simBudget = baseBudget * (1 + budgetAdjustment / 100);
  const dailyPace = daysPassed > 0 ? baseSpent / daysPassed : 0;
  const simDailyPace = dailyPace * (1 - spendingCut / 100);
  const simProjected = baseSpent + simDailyPace * (daysInMonth - daysPassed);
  const simSavings = Math.max(0, simBudget - simProjected);
  const simAvailableDaily = Math.max(0, simBudget - baseSpent) / remainingDays;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-400 shadow-lg shadow-teal-500/10">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
                Laboratorio Financiero
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Simulador predictivo, análisis de consumo y observabilidad del ciclo OODA.
              </p>
            </div>
          </div>

          {/* Sub-tabs switch */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "simulator"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulador & Gráficos</span>
            </button>
            <button
              onClick={() => setActiveTab("traces")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "traces"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Trazas Agénticas OODA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Simulator & Charts */}
      {activeTab === "simulator" && (
        <div className="space-y-6 animate-fade-in">
          {/* Scenario Simulator */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">Simulador de Escenarios "What-If"</h3>
              </div>
              <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-500/30">
                Predictivo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slider 1: Budget change */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Ajuste de Presupuesto</span>
                  <span className={budgetAdjustment >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {budgetAdjustment > 0 ? `+${budgetAdjustment}%` : `${budgetAdjustment}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="5"
                  value={budgetAdjustment}
                  onChange={(e) => setBudgetAdjustment(parseInt(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-30%</span>
                  <span>Presupuesto base: {formatCurrency(baseBudget)}</span>
                  <span>+30%</span>
                </div>
              </div>

              {/* Slider 2: Spending cut */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Reducción de Gasto Diario Restante</span>
                  <span className="text-emerald-400">-{spendingCut}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={spendingCut}
                  onChange={(e) => setSpendingCut(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Ritmo actual</span>
                  <span>-20% moderado</span>
                  <span>-40% agresivo</span>
                </div>
              </div>
            </div>

            {/* Simulator Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Presupuesto Simulado</p>
                <p className="text-base font-bold text-slate-100 mt-1">{formatCurrency(simBudget)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Cierre Proyectado</p>
                <p className="text-base font-bold text-teal-300 mt-1">{formatCurrency(simProjected)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Ahorro Simulado</p>
                <p className="text-base font-bold text-emerald-400 mt-1">{formatCurrency(simSavings)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Disponible/Día Simulado</p>
                <p className="text-base font-bold text-emerald-300 mt-1">{formatCurrency(simAvailableDaily)}</p>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">Distribución por Categoría</h3>
                </div>
              </div>
              <CategoryBreakdownChart data={chartsData?.categories || []} />
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-bold text-slate-100">Curva de Consumo Acumulativo</h3>
                </div>
              </div>
              <SpendingPaceChart data={chartsData?.timeline || []} />
            </div>
          </div>

          {/* Diagnostic KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Ritmo Diario Observado</p>
              <p className="text-xl font-bold text-slate-100 mt-1">{formatCurrency(dailyPace)}/día</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Ritmo Ideal Teórico</p>
              <p className="text-xl font-bold text-teal-300 mt-1">
                {formatCurrency(daysInMonth > 0 ? baseBudget / daysInMonth : 0)}/día
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Días Transcurridos</p>
              <p className="text-xl font-bold text-slate-100 mt-1">{daysPassed} de {daysInMonth}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Días Restantes</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{remainingDays} días</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: OODA Multi-Agent Traces */}
      {activeTab === "traces" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 animate-fade-in">
          <AgentEventsTrace />
        </div>
      )}
    </div>
  );
};
