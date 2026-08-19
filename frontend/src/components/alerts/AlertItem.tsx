import React, { useState } from "react";
import { AlertTriangle, Info, AlertOctagon, ThumbsUp, ThumbsDown, Check, Sparkles } from "lucide-react";
import { Alert, FeedbackType } from "../../types";
import { dashboardService } from "../../services/dashboard";

interface Props {
  alert: Alert;
}

const SEVERITY_CONFIG = {
  info: {
    bg: "bg-blue-950/40 border-blue-500/30 text-blue-200",
    icon: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  warning: {
    bg: "bg-amber-950/40 border-amber-500/30 text-amber-200",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  critical: {
    bg: "bg-red-950/40 border-red-500/40 text-red-200",
    icon: <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

export const AlertItem: React.FC<Props> = ({ alert }) => {
  const [feedbackSent, setFeedbackSent] = useState<FeedbackType | null>(null);
  const [loading, setLoading] = useState(false);

  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;

  const handleFeedback = async (type: FeedbackType) => {
    if (feedbackSent || loading) return;
    setLoading(true);
    try {
      await dashboardService.submitAlertFeedback(alert.id, type);
      setFeedbackSent(type);
    } catch (e) {
      console.error("Error sending alert feedback:", e);
      setFeedbackSent(type); // Optimistic UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border ${cfg.bg} transition-all space-y-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {cfg.icon}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-100">{alert.title}</h4>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {alert.agent_source}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
          </div>
        </div>

        {/* Feedback buttons */}
        <div className="shrink-0 flex items-center gap-1.5">
          {feedbackSent ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl animate-fade-in">
              <Check className="w-3 h-3 text-emerald-400" />
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>Aprendido</span>
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <button
                id={`btn-feedback-useful-${alert.id}`}
                onClick={() => handleFeedback("useful")}
                disabled={loading}
                title="Me sirvió"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-emerald-950/80 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 transition-all font-medium disabled:opacity-50"
              >
                <ThumbsUp className="w-3 h-3" />
                <span className="hidden sm:inline">Me sirvió</span>
              </button>
              <button
                id={`btn-feedback-not-useful-${alert.id}`}
                onClick={() => handleFeedback("not_useful")}
                disabled={loading}
                title="No me sirvió"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-red-950/80 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 transition-all font-medium disabled:opacity-50"
              >
                <ThumbsDown className="w-3 h-3" />
                <span className="hidden sm:inline">No útil</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
