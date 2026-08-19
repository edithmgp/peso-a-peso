import { FlaskConical, BarChart3, LineChart } from "lucide-react";

export const Laboratory: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Laboratorio Financiero</h2>
            <p className="text-sm text-slate-400">
              Análisis avanzado de patrones, velocidad de consumo y proyecciones dinámicas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 min-h-[220px] flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-10 h-10 text-emerald-500/60 mb-2" />
          <h3 className="text-sm font-semibold text-slate-200">Presupuesto vs Gasto por Categoría</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Visualización gráfica construida con Recharts (se integrará en el Sprint 3).
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 min-h-[220px] flex flex-col items-center justify-center text-center">
          <LineChart className="w-10 h-10 text-teal-500/60 mb-2" />
          <h3 className="text-sm font-semibold text-slate-200">Velocidad de Consumo Temporal</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Curva de gasto real acumulado vs curva de presupuesto ideal.
          </p>
        </div>
      </div>
    </div>
  );
};
