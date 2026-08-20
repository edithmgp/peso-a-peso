import React, { useEffect, useState } from "react";
import {
  User,
  Sparkles,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Volume2,
  DollarSign,
} from "lucide-react";
import { UserProfile, AgentTone, AlertFrequency } from "../types";
import { profileService } from "../services/profile";

const TONE_OPTIONS: { id: AgentTone; title: string; desc: string; icon: string }[] = [
  {
    id: "neutral",
    title: "Neutral y Objetivo",
    desc: "Comunicación analítica basada en datos concretos, sin valoraciones emocionales.",
    icon: "📊",
  },
  {
    id: "friendly",
    title: "Empático y Motivador",
    desc: "Tono cercano que alienta el cumplimiento de metas y celebra el ahorro alcanzado.",
    icon: "🤝",
  },
  {
    id: "direct",
    title: "Directo y Conciso",
    desc: "Mensajes cortos y accionables enfocados en la toma rápida de decisiones.",
    icon: "⚡",
  },
];

const FREQUENCY_OPTIONS: { id: AlertFrequency; title: string; desc: string }[] = [
  {
    id: "low",
    title: "Baja (Solo Críticas)",
    desc: "Suprime advertencias menores y solo emite alertas ante desvíos presupuestarios severos.",
  },
  {
    id: "normal",
    title: "Normal (Equilibrada)",
    desc: "Recibe alertas preventivas y recomendaciones periódicas de optimización de gasto.",
  },
  {
    id: "high",
    title: "Alta (Detallada)",
    desc: "Notificaciones activas sobre cualquier desvío estadístico individual por categoría.",
  },
];

const CATEGORY_NAMES: Record<string, string> = {
  food: "Comida & Supermercado",
  utilities: "Servicios e Impuestos",
  transport: "Transporte & Combustible",
  leisure: "Ocio & Salidas",
  housing: "Vivienda & Mantenimiento",
  health: "Salud & Farmacia",
  education: "Educación & Cursos",
  other: "Otros Gastos",
};

export const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [payday, setPayday] = useState("5");
  const [tone, setTone] = useState<AgentTone>("neutral");
  const [frequency, setFrequency] = useState<AlertFrequency>("normal");
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    profileService
      .getProfile()
      .then((p) => {
        setProfile(p);
        setFullName(p.full_name || "");
        setMonthlyIncome(p.monthly_income ? String(p.monthly_income) : "");
        setPayday(p.payday ? String(p.payday) : "5");
        setTone(p.preferred_tone || "neutral");
        setFrequency(p.alert_frequency || "normal");
        setScores(p.category_scores || {});
      })
      .catch((e) => setError(e?.message || "Error al cargar perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await profileService.updateProfile({
        full_name: fullName,
        monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : undefined,
        payday: parseInt(payday),
        preferred_tone: tone,
        alert_frequency: frequency,
        category_scores: scores,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message || "No se pudieron guardar los ajustes.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetScores = async () => {
    const defaultScores: Record<string, number> = {
      food: 1.0,
      utilities: 1.0,
      transport: 1.0,
      leisure: 1.0,
      housing: 1.0,
      health: 1.0,
      education: 1.0,
      other: 1.0,
    };
    setScores(defaultScores);
    try {
      await profileService.updateProfile({ category_scores: defaultScores });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message || "Error al restablecer sensibilidades.");
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-sm animate-pulse space-y-2">
        <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
        <span>Cargando memoria persistente del perfil…</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Banner */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Perfil y Memoria del Asistente
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Personalizá tus preferencias y supervisá el aprendizaje continuo del Meta-Agente.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saved && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Ajustes y memoria persistente guardados exitosamente.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-200 text-xs">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Financial & Personal Baseline */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Datos Personales y Base Financiera</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ingreso Mensual Estimado ($)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="600000"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Día de Cobro habitual
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={payday}
                onChange={(e) => setPayday(e.target.value)}
                placeholder="5"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Preferred Tone */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Tono de Comunicación de los Agentes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TONE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setTone(opt.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  tone === opt.id
                    ? "bg-purple-950/40 border-purple-500 text-slate-100 shadow-lg shadow-purple-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-xs font-bold">{opt.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Alert Frequency */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Frecuencia Global de Alertas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setFrequency(opt.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  frequency === opt.id
                    ? "bg-amber-950/40 border-amber-500 text-slate-100 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <p className="text-xs font-bold mb-1">{opt.title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Learned Memory Sensitivity Bars */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Sensibilidad Aprendida por Categoría
                </h3>
                <p className="text-[11px] text-slate-400">
                  El Meta-Agente ajusta estos coeficientes en base a tu feedback ("Me sirvió" / "No útil").
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetScores}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-all self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer a 1.0</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {Object.entries(scores).map(([slug, score]) => {
              const numScore = Number(score);
              const pct = Math.min(100, Math.round((numScore / 1.5) * 100));
              const isReduced = numScore < 0.8;
              const isIncreased = numScore > 1.05;

              return (
                <div key={slug} className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">
                      {CATEGORY_NAMES[slug] || slug.toUpperCase()}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-purple-300">
                      {numScore.toFixed(2)}x
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isReduced ? "bg-amber-500" : isIncreased ? "bg-purple-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {isReduced ? "⚠️ Alertas atenuadas" : isIncreased ? "⚡ Alta sensibilidad" : "Equilibrada"}
                    </span>
                    <span>Base: 1.00</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-purple-600/20 transition-all text-sm flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Guardando cambios en memoria…" : "Guardar Preferencias de Perfil"}</span>
        </button>
      </form>
    </div>
  );
};
