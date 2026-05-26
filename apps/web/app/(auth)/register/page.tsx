"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CursorRipple } from "@/components/ui/cursor-ripple";
import { Loader2, BookOpen, Award, Video, Users, ChevronRight } from "lucide-react";

const DEPARTMENTS = [
  { value: "ADMINISTRACION", label: "Administración" },
  { value: "RECEPCION",      label: "Recepción" },
  { value: "LIMPIEZA",       label: "Servicio de Limpieza" },
  { value: "MONITOR",        label: "Monitor" },
  { value: "DEPORTIVO",      label: "Deporocio" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", department: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.department) { setError("Selecciona un departamento"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Error al registrarse"); return; }
    router.push("/login?registered=1");
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
                Únete a la plataforma
              </span>
            </div>

            <h1 className="text-3xl font-black text-white leading-tight tracking-tight mb-3">
              Empieza tu{" "}
              <span className="text-yelau-yellow">formación</span>{" "}
              hoy.
            </h1>
            <p className="text-[#666] text-sm leading-relaxed mb-6">
              Crea tu cuenta para acceder a todos los cursos, clases en directo y certificados de tu equipo.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpen, title: "Cursos online", desc: "Accede a todos los módulos de formación en cualquier momento." },
                { icon: Video,    title: "Clases en vivo", desc: "Sesiones con instructores certificados, grabadas para revisión." },
                { icon: Award,    title: "Certificados PDF", desc: "Obtén certificados al completar cada curso." },
                { icon: Users,    title: "Seguimiento", desc: "Tu responsable monitoriza tu progreso en tiempo real." },
              ].map(f => {
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
          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Crear cuenta</h2>
            <p className="text-muted-foreground text-sm mt-1">Completa los datos para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Pedro García"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                required
                autoComplete="name"
                className="h-11"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Teléfono móvil
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                autoComplete="tel"
                className="h-11"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <label htmlFor="department" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Departamento
              </label>
              <select
                id="department"
                value={form.department}
                onChange={e => set("department", e.target.value)}
                required
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
              >
                <option value="" disabled>Selecciona tu departamento…</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
              className="w-full h-11 bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold text-sm mt-1 gap-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Crear cuenta <ChevronRight className="w-4 h-4" /></>
              }
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-yelau-yellow hover:underline font-semibold">
              Inicia sesión
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Okeymas LMS · Todos los derechos reservados
          </p>
        </div>
      </div>

    </div>
  );
}
