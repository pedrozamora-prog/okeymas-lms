"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Trophy, Zap, Star, ArrowRight, Sparkles } from "lucide-react";

const LS_KEY = "formia_onboarding_done";

interface Props {
  userName: string;
}

const HIGHLIGHTS = [
  {
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Cursos y lecciones",
    desc: "Aprende a tu ritmo con vídeos, PDFs y contenido interactivo.",
  },
  {
    icon: Trophy,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    title: "Gamificación",
    desc: "Gana puntos XP, desbloquea insignias y escala en el ranking.",
  },
  {
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "IA y simulaciones",
    desc: "Practica conversaciones reales con clientes virtuales IA.",
  },
  {
    icon: Star,
    color: "text-green-400",
    bg: "bg-green-400/10",
    title: "Certificados",
    desc: "Obtén certificados descargables al completar tus cursos.",
  },
];

export function OnboardingWelcome({ userName }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [visible,  setVisible]  = useState(false);

  const firstName = userName.split(" ")[0];

  // Mostrar solo si no se ha descartado ya en este navegador
  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) setVisible(true);
  }, []);

  async function handleStart() {
    setLoading(true);
    localStorage.setItem(LS_KEY, "1");
    setVisible(false); // cierra inmediatamente sin esperar la API
    fetch("/api/user/onboard", { method: "POST" }).catch(() => {}); // fire & forget
    setLoading(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background px-8 pt-10 pb-6 text-center">
          <div className="absolute top-4 right-4">
            <Sparkles className="w-5 h-5 text-primary/50" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">
            ¡Bienvenido, {firstName}!
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Tu plataforma de formación está lista. Esto es lo que puedes hacer:
          </p>
        </div>

        {/* Feature highlights */}
        <div className="px-8 py-5 grid grid-cols-2 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex flex-col gap-2 p-3 rounded-xl bg-muted/40 border border-border">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug">{title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-8 pb-8 pt-2">
          <Button
            className="w-full bg-primary text-yelau-black hover:bg-primary/90 font-black gap-2 h-11 text-base"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? "Un momento…" : "¡Empezar ahora!"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            Puedes volver a ver esta guía en cualquier momento desde tu perfil.
          </p>
        </div>
      </div>
    </div>
  );
}
