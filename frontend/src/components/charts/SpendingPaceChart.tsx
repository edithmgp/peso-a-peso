import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { TimelinePoint } from "../../types";

interface Props {
  data: TimelinePoint[];
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val);

export const SpendingPaceChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs min-h-[220px]">
        <span>Sin datos temporales suficientes para trazar la curva de consumo.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="actualSpendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(d) => `d${d}`}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const point = payload[0].payload as TimelinePoint;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                    <p className="font-bold text-slate-200">Día {point.day} del mes</p>
                    {point.actual !== null && (
                      <p className="text-emerald-400 font-semibold">
                        Gasto acumulado: {formatCurrency(point.actual)}
                      </p>
                    )}
                    <p className="text-teal-300">
                      Ritmo ideal: {formatCurrency(point.ideal)}
                    </p>
                    {point.daily_spent > 0 && (
                      <p className="text-slate-400 text-[10px]">
                        Gasto del día: {formatCurrency(point.daily_spent)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-slate-300 font-medium">
                {value === "actual" ? "Gasto Acumulado Real" : "Ritmo Presupuestario Ideal"}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#actualSpendGrad)"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#14b8a6"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
