import { LayoutDashboard, FlaskConical, PlusCircle, LogIn, Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background glowing gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-slate-950 text-xl">
              $
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                Peso a Peso
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline" /> Asistente Financiero Agéntico
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange("laboratory")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "laboratory"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">Laboratorio</span>
            </button>

            <button
              onClick={() => onTabChange("add-expense")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "add-expense"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Registrar</span>
            </button>

            <button
              onClick={() => onTabChange("login")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "login"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Acceso</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="z-10 border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        Peso a Peso &copy; 2026 — Asistente Inteligente Multi-Agente OODA (FastAPI + React + Supabase)
      </footer>
    </div>
  );
};
