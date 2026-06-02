"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

interface InviteData {
  email:   string;
  role:    string;
  orgName: string;
  orgLogo: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:  "Super Admin",
  BRANCH_ADMIN: "Administrador",
  MANAGER:      "Mánager",
  INSTRUCTOR:   "Instructor",
  EMPLOYEE:     "Empleado",
};

export default function InvitePage() {
  const { token }  = useParams<{ token: string }>();
  const router     = useRouter();

  const [invite,   setInvite]   = useState<InviteData | null>(null);
  const [status,   setStatus]   = useState<"loading" | "valid" | "invalid" | "done">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrorMsg(data.error); setStatus("invalid"); return; }
        setInvite(data);
        setStatus("valid");
      })
      .catch(() => { setErrorMsg("Error al cargar la invitación"); setStatus("invalid"); });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg("Las contraseñas no coinciden"); return; }
    if (password.length < 8)  { setErrorMsg("La contraseña debe tener al menos 8 caracteres"); return; }
    setErrorMsg("");
    setSaving(true);

    const res = await fetch(`/api/invitations/${token}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, password }),
    });
    const data = await res.json();

    if (!res.ok) { setErrorMsg(data.error ?? "Error al activar la cuenta"); setSaving(false); return; }

    // Auto login
    const result = await signIn("credentials", {
      email: invite!.email, password, redirect: false,
    });

    setSaving(false);
    if (result?.ok) {
      setStatus("done");
      setTimeout(() => router.push("/dashboard"), 1800);
    } else {
      router.push("/login?registered=1");
    }
  }

  /* ── Estados ── */
  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-yelau-yellow" />
    </div>
  );

  if (status === "done") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-black text-foreground">¡Cuenta activada!</h1>
        <p className="text-muted-foreground">Redirigiendo al panel…</p>
      </div>
    </div>
  );

  if (status === "invalid") return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-sm">
        <XCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h1 className="text-2xl font-black text-foreground">Invitación no válida</h1>
        <p className="text-muted-foreground text-sm">{errorMsg}</p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          Ir al inicio de sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">

      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#080808] flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yelau-yellow/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yelau-yellow/5 rounded-full blur-3xl" />
        <div className="relative z-10 text-center space-y-6 max-w-xs">
          <img src="/fitacademy-logo.svg" alt="FitAcademy" className="h-12 w-auto mx-auto" />
          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              Bienvenido a <span className="text-yelau-yellow">{invite?.orgName}</span>
            </h2>
            <p className="text-[#666] text-sm mt-3 leading-relaxed">
              Activa tu cuenta y empieza tu formación profesional hoy mismo.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-left">
            {["Accede a tus cursos asignados", "Obtén certificados oficiales", "Sigue tu progreso en tiempo real"].map(t => (
              <div key={t} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yelau-yellow flex-shrink-0" />
                <p className="text-sm text-[#888]">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <img src="/fitacademy-logo-dark.svg" alt="FitAcademy" className="h-10 w-auto" />
        </div>

        <div className="w-full max-w-sm">
          {/* Badge org */}
          <div className="mb-6 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-yelau-yellow/10 border border-yelau-yellow/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yelau-yellow" />
              <span className="text-yelau-yellow text-[10px] font-semibold tracking-wider uppercase">
                {invite?.orgName}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              · {ROLE_LABELS[invite?.role ?? ""] ?? invite?.role}
            </span>
          </div>

          <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">Activa tu cuenta</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Tu email: <span className="font-semibold text-foreground">{invite?.email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nombre completo
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre y apellidos"
                required
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirmar contraseña
              </label>
              <Input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="h-11"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 mt-2"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Activar cuenta <ChevronRight className="w-4 h-4" /></>
              }
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-yelau-yellow hover:underline font-semibold">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
