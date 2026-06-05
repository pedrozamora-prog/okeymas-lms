"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2, CreditCard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PLANS = [
  {
    key:   "STARTER" as const,
    label: "Starter",
    monthly: 159,
    annual:  1590,
    users:   "50 empleados · 1 sede",
    color:   "border-border",
    features: [
      "Cursos ilimitados",
      "Certificados PDF",
      "App móvil PWA",
      "Notificaciones automáticas",
      "Informes básicos",
      "Soporte por email",
    ],
  },
  {
    key:   "PROFESSIONAL" as const,
    label: "Professional",
    monthly: 319,
    annual:  3190,
    users:   "150 empleados · 3 sedes",
    color:   "border-blue-500/40",
    badge:   "Más popular",
    features: [
      "Todo lo de Starter",
      "Carga masiva Excel/CSV",
      "Rol manager con dashboards",
      "Inscripción automática por rol",
      "Marketplace de cursos",
      "Informes exportables",
      "Firma digital",
      "Quiz avanzado + branching",
    ],
  },
  {
    key:   "CHAIN" as const,
    label: "Chain",
    monthly: 549,
    annual:  5490,
    users:   "400 empleados · 8 sedes",
    color:   "border-primary/50",
    features: [
      "Todo lo de Professional",
      "API pública con webhooks",
      "White-label (marca blanca)",
      "Encuestas post-curso",
      "Herramienta de autoría",
      "Rutas de aprendizaje",
      "Soporte prioritario",
      "Reuniones KPI mensuales",
    ],
  },
];

type OrgBilling = {
  plan:         string;
  stripeStatus: string | null;
  stripeSubscriptionId: string | null;
};

function BillingContent() {
  const searchParams = useSearchParams();
  const [billing,   setBilling]   = useState<OrgBilling | null>(null);
  const [interval,  setInterval]  = useState<"monthly" | "annual">("monthly");
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portaling, setPortaling] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "1") toast.success("¡Plan actualizado correctamente!");
    if (searchParams.get("canceled") === "1") toast.info("Pago cancelado. Tu plan no ha cambiado.");

    fetch("/api/billing/info")
      .then(r => r.json())
      .then(d => { setBilling(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [searchParams]);

  async function handleUpgrade(plan: "STARTER" | "PROFESSIONAL" | "CHAIN") {
    setUpgrading(plan);
    try {
      const res  = await fetch("/api/billing/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Error al iniciar el pago");
    } catch {
      toast.error("Error de red");
    } finally {
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    setPortaling(true);
    try {
      const res  = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Error al abrir el portal");
    } catch {
      toast.error("Error de red");
    } finally {
      setPortaling(false);
    }
  }

  const currentPlan = billing?.plan ?? "STARTER";
  const isPastDue   = billing?.stripeStatus === "past_due";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Facturación y plan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tu suscripción y actualiza tu plan
          </p>
        </div>
        {billing?.stripeSubscriptionId && (
          <Button variant="outline" className="gap-2" onClick={handlePortal} disabled={portaling}>
            {portaling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Gestionar suscripción
          </Button>
        )}
      </div>

      {/* Past due warning */}
      {isPastDue && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Pago pendiente — actualiza tu método de pago para mantener el acceso.</p>
          <Button size="sm" variant="outline" className="ml-auto border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={handlePortal}>
            Actualizar pago
          </Button>
        </div>
      )}

      {/* Interval toggle */}
      <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
        <button
          onClick={() => setInterval("monthly")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", interval === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
        >
          Mensual
        </button>
        <button
          onClick={() => setInterval("annual")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2", interval === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
        >
          Anual
          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">2 meses gratis</span>
        </button>
      </div>

      {/* Plan cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent  = currentPlan === plan.key;
            const isUpgrade  = ["STARTER","PROFESSIONAL","CHAIN"].indexOf(plan.key) > ["STARTER","PROFESSIONAL","CHAIN"].indexOf(currentPlan as "STARTER"|"PROFESSIONAL"|"CHAIN");
            const isDowngrade = !isCurrent && !isUpgrade;
            const price      = interval === "monthly" ? plan.monthly : Math.round(plan.annual / 12);

            return (
              <div
                key={plan.key}
                className={cn(
                  "relative rounded-xl border-2 p-6 flex flex-col gap-4 transition-all",
                  plan.color,
                  isCurrent && "bg-primary/5",
                  plan.key === "PROFESSIONAL" && "shadow-lg shadow-blue-500/10"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                {isCurrent && (
                  <Badge className="absolute top-4 right-4 bg-primary text-yelau-black text-[10px]">
                    Plan actual
                  </Badge>
                )}

                <div>
                  <p className="font-black text-lg text-foreground">{plan.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.users}</p>
                </div>

                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-foreground">${price}</span>
                  <span className="text-muted-foreground text-sm mb-1">/mes</span>
                </div>
                {interval === "annual" && (
                  <p className="text-xs text-green-500 -mt-2">
                    ${plan.annual}/año · Ahorras ${plan.monthly * 2}
                  </p>
                )}

                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={isCurrent || upgrading === plan.key}
                  onClick={() => handleUpgrade(plan.key)}
                  className={cn(
                    "w-full font-bold gap-2",
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-default"
                      : isUpgrade
                        ? "bg-primary text-yelau-black hover:bg-primary/90"
                        : "variant-outline"
                  )}
                  variant={isDowngrade ? "outline" : "default"}
                >
                  {upgrading === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Plan actual"
                  ) : isUpgrade ? (
                    <><Zap className="w-4 h-4" /> Actualizar a {plan.label}</>
                  ) : (
                    `Cambiar a ${plan.label}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Enterprise CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl border border-purple-500/20 bg-purple-500/5">
        <div>
          <p className="font-bold text-foreground">Enterprise — Precio personalizado</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Empleados ilimitados, SSO/SAML, HRIS, SLA 99.9% y roadmap priorizado.
          </p>
        </div>
        <a
          href="mailto:pedro.zamora@yelaugroup.com?subject=Formia Enterprise"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold rounded-lg text-sm hover:bg-purple-700 transition-colors whitespace-nowrap"
        >
          Contactar ventas
        </a>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
