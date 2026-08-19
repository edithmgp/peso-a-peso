import React, { useEffect, useState } from "react";
import {
  Eye,
  Compass,
  Calculator,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { AgentEvent } from "../../types";
import { agentEventsService } from "../../services/agent_events";

const AGENT_CONFIG: Record<
  string,
  { label: string; phase: string; icon: React.ReactNode; color: string; border: string }
> = {
  capture: {
    label: "Agente de Captura",
    phase: "Fase 1: Observar (Ingesta)",
    icon: <Eye className="w-4 h-4 text-emerald-400" />,
    color: "bg-emerald-500/10 text-emerald-300",
    border: "border-emerald-500/30",
  },
  analyzer: {
    label: "Analizador de Patrones",
    phase: "Fase 2: Orientar (Desvíos & Anomalías)",
    icon: <Compass className="w-4 h-4 text-cyan-400" />,
    color: "bg-cyan-500/10 text-cyan-300",
    border: "border-cyan-500/30",
  },
  planner: {
    label: "Planificador & Proyector",
    phase: "Fase 3: Decidir (Disponible & Fin de Mes)",
    icon: <Calculator className="w-4 h-4 text-teal-400" />,
    color: "bg-teal-500/10 text-teal-300",
    border: "border-teal-500/30",
  },
  evaluator: {
    label: "Evaluador & Filtro Crítico",
    phase: "Fase 4: Actuar (Generación de Alertas)",
    icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    color: "bg-amber-500/10 text-amber-300",
    border: "border-amber-500/30",
  },
  meta_agent: {
    label: "Meta-Agente de Aprendizaje",
    phase: "Aprendizaje Continuo (Feedback Loop)",
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    color: "bg-purple-500/10 text-purple-300",
    border: "border-purple-500/30",
  },
};

export const AgentEventsTrace: React.FC = () => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadTraces = () => {
    setLoading(true);
    agentEventsService
      .listEvents(50, selectedAgent === "all" ? undefined : selectedAgent)
      .then(setEvents)
      .catch((e) => console.error("Error loading agent traces:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTraces();
  }, [selectedAgent]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-400" />
            Trazas del Sistema Multi-Agente OODA
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Observabilidad en tiempo real de la coordinación y estados de los 5 agentes especializados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter by agent */}
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Todos los agentes</option>
            <option value="capture">1. Captura</option>
            <option value="analyzer">2. Analizador</option>
            <option value="planner">3. Planificador</option>
            <option value="evaluator">4. Evaluador</option>
            <option value="meta_agent">5. Meta-Agente</option>
          </select>

          <button
            onClick={loadTraces}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* OODA 4-Phase Schematic Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {["capture", "analyzer", "planner", "evaluator"].map((key) => {
          const cfg = AGENT_CONFIG[key];
          return (
            <div
              key={key}
              className={`p-3 rounded-2xl border ${cfg.border} bg-slate-900/60 flex items-center gap-2.5`}
            >
              <div className={`p-2 rounded-xl ${cfg.color}`}>{cfg.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{cfg.label}</p>
                <p className="text-[10px] text-slate-400 truncate">{cfg.phase.split(" ")[1]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Events List */}
      {loading && events.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-xs space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
          <span>Consultando registro de eventos agénticos en Supabase…</span>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 border border-slate-800 text-center space-y-3">
          <Cpu className="w-12 h-12 text-slate-700 mx-auto" />
          <p className="text-slate-300 font-semibold">Sin trazas registradas todavía</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Registrá un nuevo gasto desde la sección "Registrar" para ver cómo se ejecuta el ciclo OODA paso a paso.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const cfg = AGENT_CONFIG[evt.agent_name] || {
              label: evt.agent_name,
              phase: "Proceso Agéntico",
              icon: <Cpu className="w-4 h-4 text-slate-400" />,
              color: "bg-slate-800 text-slate-300",
              border: "border-slate-700",
            };
            const isExpanded = expandedId === evt.id;

            return (
              <div
                key={evt.id}
                className={`glass-panel rounded-2xl border ${
                  isExpanded ? "border-teal-500/40 bg-slate-900/90" : "border-slate-800"
                } transition-all overflow-hidden`}
              >
                <div
                  onClick={() => toggleExpand(evt.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl ${cfg.color} shrink-0`}>{cfg.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100">{cfg.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          evento: {evt.event_type}
                        </span>
                        {evt.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-300 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-2.5 h-2.5" /> Fallo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>{cfg.phase}</span>
                        <span className="text-slate-500 font-mono">Req: {evt.request_id.slice(0, 8)}…</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      {evt.duration_ms !== undefined && (
                        <span className="font-mono text-teal-400 font-semibold">{evt.duration_ms} ms</span>
                      )}
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(evt.created_at)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Expanded Payload Inspector */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs font-mono space-y-3 animate-fade-in">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-semibold mb-1">
                        Input Data
                      </p>
                      <pre className="p-3 bg-slate-900 rounded-xl text-slate-300 overflow-x-auto text-[11px] border border-slate-800">
                        {JSON.stringify(evt.input_data || {}, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-semibold mb-1">
                        Output Data
                      </p>
                      <pre className="p-3 bg-slate-900 rounded-xl text-emerald-300 overflow-x-auto text-[11px] border border-slate-800">
                        {JSON.stringify(evt.output_data || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
