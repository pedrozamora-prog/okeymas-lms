"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CursorRipple } from "@/components/ui/cursor-ripple";
import { Loader2, BookOpen, Award, Video, Users, ChevronRight } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Formación estructurada",
    desc:  "Cursos, módulos y lecciones organizados para el Técnico en Acondicionamiento Físico.",
  },
  {
    icon: Video,
    title: "Clases en directo",
    desc:  "Sesiones en vivo con instructores certificados, grabadas para su revisión posterior.",
  },
  {
    icon: Award,
    title: "Certificados oficiales",
    desc:  "Obtén certificados de finalización y profesionales al superar cada curso.",
  },
  {
    icon: Users,
    title: "Seguimiento por equipos",
    desc:  "Los responsables monitorizan el progreso de cada empleado en tiempo real.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) { setError("Email o contraseña incorrectos"); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">

      {/* ── PANEL IZQUIERDO ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-[#080808] flex-col overflow-hidden">
        <CursorRipple />

        <div className="absolute inset-0 bg-gradient-to-br from-yelau-yellow/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yelau-yellow/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full px-10 py-8">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <Image src="/logo.png" alt="Okeymas LMS" width={56} height={56} className="h-14 w-14 object-contain flex-shrink-0" priority />
            <div className="leading-tight">
              <p className="text-2xl font-black tracking-widest uppercase text-white">OKEYMAS</p>
              <p className="text-lg font-bold tracking-widest uppercase text-yelau-yellow">LMS</p>
            </div>
          </div>

          {/* Centro */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-yelau-yellow/10 border border-yelau-yellow/20 rounded-full px-3 py-1 mb-4 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-yelau-yellow animate-pulse" />
              <span className="text-yelau-yellow text-[10px] font-semibold tracking-wider uppercase">
                Plataforma de formación profesional
              </span>
            </div>

            <h1 className="text-3xl font-black text-white leading-tight tracking-tight mb-3">
              Forma a tu equipo.{" "}
              <span className="text-yelau-yellow">Certifica</span>{" "}
              su excelencia.
            </h1>
            <p className="text-[#666] text-sm leading-relaxed mb-6">
              LMS diseñado para gimnasios que quieren formar, evaluar y certificar
              a sus empleados de forma profesional.
            </p>

            {/* Features en 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-yelau-yellow/20 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-yelau-yellow/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-yelau-yellow" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{f.title}</p>
                      <p className="text-[10px] text-[#555] mt-0.5 leading-tight">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center gap-8 pt-4 border-t border-white/5">
            {[
              { value: "100%", label: "Online" },
              { value: "IA",   label: "Incluida" },
              { value: "PDF",  label: "Certificados" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-sm font-black text-yelau-yellow">{s.value}</p>
                <p className="text-[10px] text-[#555] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── PANEL DERECHO ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-8 relative">

        {/* Logo mobile */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <Image src="/logo.png" alt="Okeymas LMS" width={44} height={44} className="h-11 w-11 object-contain flex-shrink-0" priority />
          <div className="leading-tight">
            <p className="text-xl font-black tracking-widest uppercase text-foreground">OKEYMAS</p>
            <p className="text-sm font-bold tracking-widest uppercase text-yelau-yellow">LMS</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Header formulario */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground text-sm mt-1">Accede con tu cuenta corporativa</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold text-sm mt-2 gap-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Entrar <ChevronRight className="w-4 h-4" /></>
              }
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-yelau-yellow hover:underline font-semibold">
              Regístrate
            </Link>
          </p>

          {/* Footer derecho */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} Okeymas LMS · Todos los derechos reservados
          </p>
        </div>
      </div>

    </div>
  );
}
