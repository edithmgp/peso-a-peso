import { useState } from "react";
import { LogIn, Lock, Mail, ShieldAlert } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Autenticación delegada a Supabase Auth (se integrará en Sprint 1).");
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-6">
      <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Acceso Seguro</h2>
          <p className="text-xs text-slate-400">
            Inicia sesión para acceder a tu historial financiero y memoria de agentes.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            Ingresar con Supabase Auth
          </button>
        </form>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Tus datos financieros están protegidos con Row Level Security (RLS) en Supabase.</span>
        </div>
      </div>
    </div>
  );
};
