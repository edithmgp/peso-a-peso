import { useState } from "react";
import { LogIn, Lock, Mail, ShieldAlert, UserPlus, LogOut, CheckCircle2, UserCheck } from "lucide-react";
import { authService } from "../services/auth";
import { useAuth } from "../hooks/useAuth";

export const Login: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await authService.signUpWithEmail(email, password, fullName);
        if (error) {
          setMessage({ text: error.message, type: "error" });
        } else {
          setMessage({
            text: isConfigured
              ? "Registro exitoso. Revisa tu correo electrónico para confirmar la cuenta."
              : "Usuario demo registrado correctamente.",
            type: "success",
          });
        }
      } else {
        const { user: loggedUser, error } = await authService.signInWithEmail(email, password);
        if (error) {
          setMessage({ text: error.message, type: "error" });
        } else if (loggedUser) {
          setMessage({ text: "Sesión iniciada correctamente.", type: "success" });
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Error inesperado al procesar la autenticación.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await authService.signOut();
    setLoading(false);
    setMessage({ text: "Sesión cerrada correctamente.", type: "success" });
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4">
      {user && (
        <div className="glass-panel-glow rounded-3xl p-6 border border-emerald-500/30 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sesión Activa</h3>
            <p className="text-xs text-slate-300 mt-0.5">{user.email}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">ID: {user.id}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold rounded-xl text-xs transition-all"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? "Crear Cuenta" : "Acceso Seguro"}
          </h2>
          <p className="text-xs text-slate-400">
            {isSignUp
              ? "Regístrate para guardar tu presupuesto e historial financiero en Supabase."
              : "Inicia sesión para acceder a tu dashboard y memoria de agentes."}
          </p>
        </div>

        {/* Toggle between Sign In / Sign Up */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              !isSignUp ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              isSignUp ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Registrarse
          </button>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/80 border border-rose-500/40 text-rose-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Edith González"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

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
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20"
          >
            {loading ? "Procesando..." : isSignUp ? "Crear Cuenta en Supabase" : "Ingresar con Supabase Auth"}
          </button>
        </form>

        <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            {isConfigured
              ? "Conexión activa con Supabase PostgreSQL y Row Level Security (RLS)."
              : "Modo desarrollo local: Se admiten credenciales demo mientras se configuran las variables de Supabase."}
          </span>
        </div>
      </div>
    </div>
  );
};
