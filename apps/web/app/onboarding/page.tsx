"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, Users, Mail, CheckCircle2,
  ChevronRight, ChevronLeft, Plus, X,
  Loader2, Rocket, Eye, EyeOff,
} from "lucide-react";

/* ── Pasos ── */
const STEPS = [
  { id: 1, label: "Tu organización", icon: Building2 },
  { id: 2, label: "Tu equipo",       icon: Users     },
  { id: 3, label: "Email",           icon: Mail      },
  { id: 4, label: "¡Listo!",         icon: Rocket    },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingPage() {
  const router = useRouter();

  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [showKey, setShowKey] = useState(false);

  /* Paso 1 — Organización */
  const [orgName,  setOrgName]  = useState("");
  const [logoUrl,  setLogoUrl]  = useState("");

  /* Paso 2 — Equipo */
  const [emails, setEmails] = useState<string[]>(["", "", ""]);

  /* Paso 3 — Email */
  const [fromName,    setFromName]    = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [replyTo,     setReplyTo]     = useState("");
  const [apiKey,      setApiKey]      = useState("");

  /* Resultados finales */
  const [sentCount, setSentCount] = useState(0);

  /* ── Helpers ── */
  const validEmails = emails.filter(e => EMAIL_RE.test(e.trim()));
  const pct         = ((step - 1) / (STEPS.length - 1)) * 100;

  function addEmail()                  { setEmails(e => [...e, ""]); }
  function removeEmail(i: number)      { setEmails(e => e.filter((_, idx) => idx !== i)); }
  function updateEmail(i: number, v: string) { setEmails(e => e.map((x, idx) => idx === i ? v : x)); }

  /* ── Envío final ── */
  async function handleFinish() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName:      orgName || undefined,
          logoUrl:      logoUrl || undefined,
          emailFromName:    fromName    || undefined,
          emailFromAddress: fromAddress || undefined,
          emailReplyTo:     replyTo     || undefined,
          resendApiKey:     apiKey      || undefined,
          inviteEmails: validEmails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");

      setSentCount(data.invitations?.filter((i: { status: string }) => i.status === "sent").length ?? 0);
      setStep(4);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al completar el onboarding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">

      {/* Header con logo y progreso */}
      <header className="px-6 pt-6 pb-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <img src="/fitacademy-logo.svg" alt="FitAcademy" className="h-9 w-auto" />
          {step < 4 && (
            <span className="text-xs text-[#555]">
              Paso {step} de {STEPS.length - 1}
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        {step < 4 && (
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-yelau-yellow transition-all duration-500 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Steps indicadores */}
        {step < 4 && (
          <div className="flex justify-between mt-3 mb-8">
            {STEPS.slice(0, 3).map(s => {
              const Icon    = s.icon;
              const active  = s.id === step;
              const done    = s.id < step;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done   ? "bg-yelau-yellow" :
                    active ? "bg-yelau-yellow/20 border border-yelau-yellow" :
                             "bg-[#1a1a1a]"
                  }`}>
                    {done
                      ? <CheckCircle2 className="w-3 h-3 text-[#0C0C0C]" />
                      : <Icon className={`w-2.5 h-2.5 ${active ? "text-yelau-yellow" : "text-[#444]"}`} />
                    }
                  </div>
                  <span className={`text-[11px] font-medium ${active ? "text-yelau-yellow" : done ? "text-[#666]" : "text-[#444]"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">

          {/* ── PASO 1: ORGANIZACIÓN ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">
                  Bienvenido a <span className="text-yelau-yellow">FitAcademy</span>
                </h1>
                <p className="text-[#666] mt-2 text-sm">
                  Configura tu plataforma en 3 pasos. Puedes cambiar todo esto más tarde desde Configuración.
                </p>
              </div>

              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[#888] text-xs uppercase tracking-wider">
                    Nombre de tu organización
                  </Label>
                  <Input
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Ej: Okeymas Fitness Club"
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11 focus-visible:border-yelau-yellow focus-visible:ring-0"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#888] text-xs uppercase tracking-wider">
                    URL del logotipo <span className="normal-case font-normal text-[#555]">(opcional)</span>
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://tudominio.com/logo.png"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11 focus-visible:border-yelau-yellow focus-visible:ring-0 flex-1"
                    />
                    <div className="w-11 h-11 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {logoUrl
                        ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        : <Building2 className="w-5 h-5 text-[#333]" />
                      }
                    </div>
                  </div>
                  <p className="text-[11px] text-[#555]">
                    Aparecerá en el sidebar y en los certificados
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-yelau-yellow text-[#0C0C0C] hover:bg-yelau-yellow/90 font-bold gap-2 text-base"
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* ── PASO 2: EQUIPO ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">
                  Invita a tu <span className="text-yelau-yellow">equipo</span>
                </h1>
                <p className="text-[#666] mt-2 text-sm">
                  Añade los emails de tus empleados y recibirán una invitación para activar su cuenta.
                  Puedes hacerlo también desde Usuarios más adelante.
                </p>
              </div>

              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-3">
                {emails.map((email, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={e => updateEmail(i, e.target.value)}
                      placeholder={`empleado${i + 1}@empresa.com`}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10 focus-visible:border-yelau-yellow focus-visible:ring-0 flex-1"
                    />
                    {emails.length > 1 && (
                      <button
                        onClick={() => removeEmail(i)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#444] hover:text-white hover:border-[#444] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {emails.length < 10 && (
                  <button
                    onClick={addEmail}
                    className="flex items-center gap-1.5 text-xs text-[#555] hover:text-yelau-yellow transition-colors py-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir otro
                  </button>
                )}
              </div>

              {validEmails.length > 0 && (
                <div className="flex items-center gap-2 bg-yelau-yellow/10 border border-yelau-yellow/20 rounded-lg px-4 py-2.5">
                  <Users className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                  <p className="text-sm text-yelau-yellow">
                    Se enviarán <strong>{validEmails.length}</strong> invitación{validEmails.length > 1 ? "es" : ""}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="gap-1 text-[#555] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 h-12 bg-yelau-yellow text-[#0C0C0C] hover:bg-yelau-yellow/90 font-bold gap-2"
                >
                  {validEmails.length > 0 ? "Continuar" : "Saltar por ahora"}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* ── PASO 3: EMAIL ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">
                  Configura tu <span className="text-yelau-yellow">email</span>
                </h1>
                <p className="text-[#666] mt-2 text-sm">
                  Personaliza el remitente de los emails automáticos. Sin configurar, los emails saldrán
                  desde <span className="text-[#888]">noreply@fitacademy.com</span>.
                </p>
              </div>

              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#888] text-xs uppercase tracking-wider">Nombre del remitente</Label>
                    <Input
                      value={fromName}
                      onChange={e => setFromName(e.target.value)}
                      placeholder="Mi Gimnasio"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10 focus-visible:border-yelau-yellow focus-visible:ring-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#888] text-xs uppercase tracking-wider">Email de envío</Label>
                    <Input
                      type="email"
                      value={fromAddress}
                      onChange={e => setFromAddress(e.target.value)}
                      placeholder="formacion@tudominio.com"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10 focus-visible:border-yelau-yellow focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#888] text-xs uppercase tracking-wider">
                    Email de respuesta <span className="font-normal text-[#555]">(opcional)</span>
                  </Label>
                  <Input
                    type="email"
                    value={replyTo}
                    onChange={e => setReplyTo(e.target.value)}
                    placeholder="rrhh@tudominio.com"
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10 focus-visible:border-yelau-yellow focus-visible:ring-0 max-w-xs"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#1e1e1e]">
                  <Label className="text-[#888] text-xs uppercase tracking-wider">
                    Resend API Key <span className="font-normal text-[#555]">(para enviar desde tu dominio)</span>
                  </Label>
                  <div className="relative max-w-sm">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="re_xxxxxxxxxxxx"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10 pr-10 font-mono text-sm focus-visible:border-yelau-yellow focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-white transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#555]">
                    Obtén tu key en resend.com/api-keys
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="gap-1 text-[#555] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 h-12 bg-yelau-yellow text-[#0C0C0C] hover:bg-yelau-yellow/90 font-bold gap-2"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</>
                    : (fromName || fromAddress)
                      ? <>"Guardar y finalizar <ChevronRight className="w-5 h-5" /></>"
                      : <>Saltar y finalizar <ChevronRight className="w-5 h-5" /></>
                  }
                </Button>
              </div>
            </div>
          )}

          {/* ── PASO 4: LISTO ── */}
          {step === 4 && (
            <div className="space-y-8 text-center">
              {/* Animación */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-yelau-yellow flex items-center justify-center shadow-2xl shadow-yelau-yellow/30">
                    <Rocket className="w-12 h-12 text-[#0C0C0C]" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-black text-white leading-tight">
                  ¡Tu <span className="text-yelau-yellow">FitAcademy</span><br />está listo!
                </h1>
                <p className="text-[#666] mt-3 text-sm max-w-sm mx-auto">
                  La plataforma está configurada. Empieza creando tu primer curso o explora el panel de administración.
                </p>
              </div>

              {/* Resumen */}
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 text-left space-y-3 max-w-sm mx-auto">
                {[
                  { done: true,            label: "Organización configurada" },
                  { done: sentCount > 0,   label: sentCount > 0 ? `${sentCount} invitación${sentCount > 1 ? "es" : ""} enviada${sentCount > 1 ? "s" : ""}` : "Sin invitaciones (puedes hacerlo desde Usuarios)" },
                  { done: !!(fromName || fromAddress), label: (fromName || fromAddress) ? "Email personalizado configurado" : "Usando email de FitAcademy" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? "bg-green-500" : "bg-[#1e1e1e]"
                    }`}>
                      <CheckCircle2 className={`w-3 h-3 ${item.done ? "text-white" : "text-[#333]"}`} />
                    </div>
                    <p className={`text-sm ${item.done ? "text-white" : "text-[#555]"}`}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Button
                  onClick={() => router.push("/admin/courses/new")}
                  className="w-full h-12 bg-yelau-yellow text-[#0C0C0C] hover:bg-yelau-yellow/90 font-bold gap-2"
                >
                  <Rocket className="w-5 h-5" /> Crear mi primer curso
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="text-[#555] hover:text-white"
                >
                  Ir al panel principal →
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
