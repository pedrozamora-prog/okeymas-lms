"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const LS_KEY = "formia_install_dismissed";

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Ya está instalado como PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    setIsStandalone(false);

    // Fue descartado antes
    if (localStorage.getItem(LS_KEY)) return;

    // Detectar iOS (Safari no lanza beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
    setIsIos(ios);

    if (ios) {
      // En iOS mostrar instrucción manual tras 3 segundos
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    // Chrome/Edge/Android: escuchar el evento nativo
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(LS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    } else {
      setInstalling(false);
    }
  }

  if (!visible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0C0C0C] border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-3 items-start">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-[#FCE900] flex-shrink-0 flex items-center justify-center">
          <span className="text-[#0C0C0C] text-xl font-black leading-none">F</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">
            Instala Formia en tu dispositivo
          </p>

          {isIos ? (
            <p className="text-white/50 text-xs mt-1 leading-relaxed">
              Pulsa <span className="text-white/80">Compartir</span>{" "}
              <span className="inline-block">⬆</span>{" "}
              y luego <span className="text-white/80">&quot;Añadir a inicio&quot;</span>
            </p>
          ) : (
            <p className="text-white/50 text-xs mt-1 leading-relaxed">
              Accede al instante, sin navegador. Funciona sin conexión.
            </p>
          )}

          {!isIos && (
            <button
              onClick={install}
              disabled={installing}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FCE900] text-[#0C0C0C] text-xs font-semibold transition-all hover:brightness-90 active:scale-95 disabled:opacity-60"
            >
              {installing ? (
                <Smartphone className="w-3 h-3 animate-pulse" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              {installing ? "Instalando…" : "Instalar app"}
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 -mt-0.5"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
