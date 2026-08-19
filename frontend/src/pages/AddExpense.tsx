import { useState } from "react";
import { PlusCircle, Camera, MessageSquare, CheckCircle2 } from "lucide-react";

export const AddExpense: React.FC = () => {
  const [tab, setTab] = useState<"manual" | "text" | "ocr">("manual");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("food");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Mode selection tabs */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "manual" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Manual
        </button>
        <button
          onClick={() => setTab("text")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "text" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Texto / IA
        </button>
        <button
          onClick={() => setTab("ocr")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            tab === "ocr" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-4 h-4" /> Ticket OCR
        </button>
      </div>

      {submitted && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Gasto enviado correctamente al Orquestador de Agentes (Sprint 0 base).</span>
        </div>
      )}

      {/* Manual Input Form */}
      {tab === "manual" && (
        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto ($)
            </label>
            <input
              type="number"
              required
              placeholder="Ej: 15200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-lg font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Comercio
            </label>
            <input
              type="text"
              placeholder="Ej: Supermercado Coto"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="food">Comida</option>
              <option value="utilities">Servicios</option>
              <option value="transport">Transporte</option>
              <option value="leisure">Ocio</option>
              <option value="housing">Vivienda</option>
              <option value="health">Salud</option>
              <option value="education">Educación</option>
              <option value="other">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              placeholder="Ej: Compra mensual de insumos"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-sm"
          >
            Registrar y Analizar Gasto
          </button>
        </form>
      )}

      {/* Natural Language Input */}
      {tab === "text" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <p className="text-xs text-slate-400">
            Escribí libremente el gasto y el <strong>Agente de Captura + Gemini</strong> extraerá los campos.
          </p>
          <textarea
            placeholder='Ej: "Gasté $15.000 en Coto comprando carne y verduras"'
            rows={4}
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-4 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">
            Procesar con IA
          </button>
        </div>
      )}

      {/* OCR Photo Upload */}
      {tab === "ocr" && (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Subir Fotografía de Ticket</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Gemini Vision extraerá los datos y te solicitará confirmación humana antes de persistir.
            </p>
          </div>
          <input type="file" accept="image/*" className="text-xs text-slate-400 mx-auto" />
        </div>
      )}
    </div>
  );
};
