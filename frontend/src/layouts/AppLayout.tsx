import { LayoutDashboard, FlaskConical, PlusCircle, LogIn, Sparkles, Receipt, Wallet, CalendarClock, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_MAIN = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "add-expense", label: "Registrar", icon: PlusCircle },
  { id: "expenses", label: "Gastos", icon: Receipt },
  { id: "laboratory", label: "Laboratorio", icon: FlaskConical },
];

const NAV_CONFIG = [
  { id: "budget", label: "Presupuesto", icon: Wallet },
  { id: "fixed-expenses", label: "Gastos Fijos", icon: CalendarClock },
  { id: "login", label: "Acceso", icon: LogIn },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [configOpen, setConfigOpen] = useState(false);

  const navBtn = (id: string, label: string, Icon: React.ElementType) => (
    <button
      key={id}
      id={`nav-${id}`}
      onClick={() => { onTabChange(id); setConfigOpen(false); }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        activeTab === id
          ? "bg-emerald-600 text-white shadow-sm"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background glowing gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
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

          {/* Main Nav */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {NAV_MAIN.map(({ id, label, icon: Icon }) => navBtn(id, label, Icon))}

            {/* Config dropdown */}
            <div className="relative">
              <button
                id="nav-config-menu"
                onClick={() => setConfigOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  NAV_CONFIG.some((n) => n.id === activeTab)
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Configurar</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${configOpen ? "rotate-180" : ""}`} />
              </button>

              {configOpen && (
                <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl shadow-black/30 py-1 min-w-[160px] z-50">
                  {NAV_CONFIG.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      id={`nav-config-${id}`}
                      onClick={() => { onTabChange(id); setConfigOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all ${
                        activeTab === id
                          ? "bg-emerald-600/20 text-emerald-300"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
