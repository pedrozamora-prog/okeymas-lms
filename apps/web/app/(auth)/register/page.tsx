"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CursorRipple } from "@/components/ui/cursor-ripple";
import { Loader2, BookOpen, Award, Video, Users, ChevronRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", departmentId: "" });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/public/departments")
      .then(r => r.json())
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.departmentId) { setError("Selecciona un departamento"); return; }
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full px-10 py-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src="/logo-light.png" alt="Formia" className="h-28 w-auto object-contain object-left" />
          </div>

          {/* Centro */}
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-[10px] font-semibold tracking-wider uppercase">
                Únete a la plataforma
              </span>
            </div>

            <h1 className="text-3xl font-black text-white leading-tight tracking-tight mb-3">
              Empieza tu{" "}
              <span className="text-primary">formación</span>{" "}
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
                  <div key={f.title} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-primary/20 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
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
                <p className="text-sm font-black text-primary">{s.value}</p>
                <p className="text-[10px] text-[#555] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-8 relative">

        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="Formia" className="h-12 w-auto object-contain object-left" />
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
                value={form.departmentId}
                onChange={e => set("departmentId", e.target.value)}
                required
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
              >
                <option value="" disabled>Selecciona tu departamento…</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
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
              className="w-full h-11 bg-primary text-yelau-black hover:bg-primary/90 font-bold text-sm mt-1 gap-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Crear cuenta <ChevronRight className="w-4 h-4" /></>
              }
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Inicia sesión
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Formia · Todos los derechos reservados
          </p>
        </div>
      </div>

    </div>
  );
}
