"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handler = () => window.location.reload();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, []);

  function handleRetry() {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  return (
    <div className="min-h-dvh bg-[#0C0C0C] flex flex-col items-center justify-center p-6 text-white">
      {/* Logo mark */}
      <div className="w-20 h-20 rounded-2xl bg-[#FCE900] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(252,233,0,0.3)]">
        <span className="text-[#0C0C0C] text-5xl font-black leading-none select-none">F</span>
      </div>

      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        <WifiOff className="w-7 h-7 text-white/50" />
      </div>

      {/* Copy */}
      <h1 className="text-2xl font-bold text-white mb-2 text-center">Sin conexión</h1>
      <p className="text-white/50 text-center max-w-xs mb-8 text-sm leading-relaxed">
        No hay acceso a internet. Revisa tu conexión y vuelve a intentarlo.
        Las páginas visitadas recientemente pueden estar disponibles sin conexión.
      </p>

      {/* Retry button */}
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCE900] text-[#0C0C0C] font-semibold text-sm transition-all hover:brightness-90 active:scale-95 disabled:opacity-60"
      >
        <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
        {retrying ? "Reconectando…" : "Reintentar"}
      </button>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 gap-3 w-full max-w-sm">
        {[
          { emoji: "📚", text: "Tus apuntes se guardan cuando vuelvas a conectarte" },
          { emoji: "🏆", text: "Tu progreso local se sincroniza automáticamente" },
          { emoji: "🔔", text: "Las notificaciones se retoman al reconectar" },
        ].map(({ emoji, text }) => (
          <div
            key={text}
            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60"
          >
            <span className="text-base leading-tight">{emoji}</span>
            <span className="leading-snug">{text}</span>
          </div>
        ))}
      </div>

      <p className="mt-10 text-white/20 text-xs">Formia — Plataforma de Formación Profesional</p>
    </div>
  );
}
