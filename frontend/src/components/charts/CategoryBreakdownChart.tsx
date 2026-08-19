import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { CategorySpendingItem } from "../../types";

interface Props {
  data: CategorySpendingItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",      // Orange
  utilities: "#3b82f6", // Blue
  transport: "#06b6d4", // Cyan
  leisure: "#a855f7",   // Purple
  housing: "#eab308",   // Yellow
  health: "#10b981",    // Emerald
  education: "#6366f1", // Indigo
  other: "#64748b",     // Slate
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val);

export const CategoryBreakdownChart: React.FC<Props> = ({ data }) => {
  const chartData = data.filter((d) => d.amount > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs min-h-[220px]">
        <span>No se registran gastos por categoría en el mes activo.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
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
                const item = payload[0].payload as CategorySpendingItem;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                    <p className="font-bold text-slate-200">{item.name}</p>
                    <p className="text-emerald-400 font-semibold mt-0.5">{formatCurrency(item.amount)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.slug} fill={CATEGORY_COLORS[entry.slug] || "#10b981"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
