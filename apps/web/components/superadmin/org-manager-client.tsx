"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Key, RefreshCw, Copy, Check, Building2, Users, BookOpen, Webhook } from "lucide-react";
import Link from "next/link";

const PLAN_LIMITS: Record<string, number> = {
  STARTER: 50, PROFESSIONAL: 150, CHAIN: 400, ENTERPRISE: 99999,
};
const PLAN_PRICE: Record<string, string> = {
  STARTER: "149€/mes", PROFESSIONAL: "299€/mes", CHAIN: "499€/mes", ENTERPRISE: "A medida",
};

interface Org {
  id: string; name: string; slug: string; isActive: boolean;
  plan: string; maxUsers: number; planExpiresAt: string | null;
  apiKey: string | null; primaryColor: string | null;
  _count: { users: number; courses: number; enrollments: number };
  webhooks: { id: string; url: string; events: string[]; isActive: boolean }[];
}

export function OrgManagerClient({ org }: { org: Org }) {
  const router = useRouter();
  const [plan, setPlan]           = useState(org.plan);
  const [isActive, setActive]     = useState(org.isActive);
  const [expiresAt, setExpires]   = useState(org.planExpiresAt?.slice(0, 10) ?? "");
  const [apiKey, setApiKey]       = useState(org.apiKey ?? "");
  const [copied, setCopied]       = useState(false);
  const [saving, setSaving]       = useState(false);
  // Webhook form
  const [whUrl, setWhUrl]         = useState("");
  const [whEvents, setWhEvents]   = useState<string[]>(["COURSE_COMPLETED"]);

  const EVENTS = ["COURSE_COMPLETED", "CERTIFICATE_ISSUED", "USER_CREATED", "ENROLLMENT_CREATED"];

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/superadmin/orgs/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          maxUsers: PLAN_LIMITS[plan],
          isActive,
          planExpiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Organización actualizada");
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateKey() {
    try {
      const res = await fetch(`/api/superadmin/orgs/${org.id}/apikey`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApiKey(data.apiKey);
      toast.success("API key generada");
    } catch {
      toast.error("Error al generar la API key");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddWebhook() {
    if (!whUrl) { toast.error("Introduce una URL"); return; }
    try {
      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: whUrl, events: whEvents, organizationId: org.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Webhook añadido");
      setWhUrl("");
      router.refresh();
    } catch {
      toast.error("Error al añadir webhook");
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
          <Link href="/superadmin"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground">{org.name}</h1>
          <p className="text-muted-foreground text-sm">{org.slug}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Usuarios", value: `${org._count.users} / ${org.maxUsers}`, icon: Users },
          { label: "Cursos",   value: org._count.courses,   icon: BookOpen   },
          { label: "Inscripciones", value: org._count.enrollments, icon: Building2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <s.icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> Plan y estado
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Plan activo</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_PRICE).map(([p, price]) => (
                    <SelectItem key={p} value={p}>
                      {p} — {price} ({PLAN_LIMITS[p] === 99999 ? "∞" : PLAN_LIMITS[p]} usuarios)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expires">Vence el</Label>
              <Input id="expires" type="date" value={expiresAt} onChange={e => setExpires(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setActive} id="active" />
            <label htmlFor="active" className="text-sm cursor-pointer">
              Organización {isActive ? "activa" : "inactiva"}
            </label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-yelau-black hover:bg-primary/90 font-bold">
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> API Key
          </h2>
          <p className="text-xs text-muted-foreground">
            Permite a la organización conectar sistemas externos (RRHH, Factorial, BambooHR).
          </p>
          {apiKey ? (
            <div className="flex gap-2">
              <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono text-foreground truncate">
                {apiKey}
              </code>
              <Button size="sm" variant="outline" onClick={handleCopy} className="flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerateKey} className="flex-shrink-0">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateKey} variant="outline" className="gap-2">
              <Key className="w-4 h-4" />
              Generar API key
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Webhook className="w-4 h-4 text-primary" /> Webhooks
          </h2>
          <p className="text-xs text-muted-foreground">
            Notificaciones automáticas a sistemas externos cuando ocurren eventos.
          </p>

          {org.webhooks.length > 0 && (
            <div className="space-y-2">
              {org.webhooks.map(wh => (
                <div key={wh.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
                  <code className="flex-1 truncate text-xs font-mono">{wh.url}</code>
                  <div className="flex gap-1 flex-wrap">
                    {wh.events.map(e => (
                      <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>
                    ))}
                  </div>
                  <Badge variant="outline" className={wh.isActive ? "text-green-600 text-[10px]" : "text-[10px]"}>
                    {wh.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-medium text-foreground">Añadir webhook</p>
            <Input placeholder="https://tu-sistema.com/webhook" value={whUrl} onChange={e => setWhUrl(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              {EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whEvents.includes(ev)}
                    onChange={e => setWhEvents(prev =>
                      e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev)
                    )}
                    className="rounded"
                  />
                  <span className="text-xs">{ev}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleAddWebhook} variant="outline" size="sm" className="gap-2">
              <Webhook className="w-3.5 h-3.5" />
              Añadir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
