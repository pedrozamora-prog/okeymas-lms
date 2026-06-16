"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Zap, Copy, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Clock, ChevronDown, ChevronUp, Key, Plug, ExternalLink,
  MessageCircle, Send, Eye, EyeOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const PROVIDERS = [
  {
    id: "factorial",
    name: "Factorial",
    logo: "F",
    color: "bg-violet-600",
    description: "RRHH más usado en España. Soporte nativo de webhooks.",
    docsUrl: "https://apidoc.factorialhr.com/docs/webhooks",
    eventKey: "type",
    steps: [
      "Ve a Configuración → Integraciones → Webhooks en Factorial",
      "Crea un nuevo webhook con la URL de abajo",
      'Selecciona los eventos: "Employee Created", "Employee Updated", "Employee Terminated"',
      "En la URL, añade ?provider=factorial al final",
      "Guarda y haz clic en Test para verificar la conexión",
    ],
  },
  {
    id: "personio",
    name: "Personio",
    logo: "P",
    color: "bg-blue-600",
    description: "Plataforma RRHH enterprise con API REST y webhooks.",
    docsUrl: "https://developer.personio.de/docs/webhooks",
    eventKey: "event",
    steps: [
      "Ve a Configuración → Integraciones → API en Personio",
      "Crea un nuevo webhook endpoint con la URL de abajo",
      "Añade ?provider=personio al final de la URL",
      'Activa los eventos: "employee.created", "employee.updated", "employee.terminated"',
      "Copia el secret que genera Personio y ponlo en el header Authorization: Bearer {apiKey}",
    ],
  },
  {
    id: "bizneo",
    name: "Bizneo",
    logo: "B",
    color: "bg-orange-500",
    description: "RRHH con foco en el sector fitness y retail en España.",
    docsUrl: "https://bizneo.com/api",
    eventKey: "event",
    steps: [
      "Ve a Configuración → API & Integraciones en Bizneo",
      "Añade la URL del webhook de Formia",
      "Añade ?provider=generic al final de la URL",
      "Configura el header: Authorization: Bearer {apiKey}",
      "Mapea los campos email, name y department",
    ],
  },
  {
    id: "generic",
    name: "Genérico / Zapier / Make",
    logo: "⚡",
    color: "bg-gray-600",
    description: "Compatible con cualquier sistema vía Zapier, Make.com o webhook propio.",
    docsUrl: null,
    eventKey: "event",
    steps: [
      "Crea un webhook en tu herramienta (Zapier, Make, etc.)",
      "Usa la URL del webhook de abajo",
      "Añade el header: Authorization: Bearer {apiKey}",
      "Envía un JSON con el formato especificado debajo",
    ],
  },
];

// ── WhatsApp providers ────────────────────────────────────────────────────────

const WA_PROVIDERS = [
  {
    id: "atendia",
    name: "AtendIA",
    logo: "A",
    color: "bg-purple-600",
    description: "Plataforma WhatsApp española. Sin configurar Meta ni tokens.",
    fields: { apiKey: true, apiUrl: false, fromPhone: false },
    apiKeyLabel: "API Key de AtendIA",
    apiKeyPlaceholder: "at_...",
  },
  {
    id: "wati",
    name: "Wati",
    logo: "W",
    color: "bg-green-600",
    description: "Plataforma WhatsApp Business API con panel de mensajes.",
    fields: { apiKey: true, apiUrl: true, fromPhone: false },
    apiKeyLabel: "Token de Wati",
    apiKeyPlaceholder: "eyJhbGciOi...",
    apiUrlLabel: "URL de tu servidor Wati",
    apiUrlPlaceholder: "https://live-server-XXXXX.wati.io",
  },
  {
    id: "ycloud",
    name: "YCloud",
    logo: "Y",
    color: "bg-blue-600",
    description: "API WhatsApp Business con alta tasa de entrega.",
    fields: { apiKey: true, apiUrl: false, fromPhone: true },
    apiKeyLabel: "API Key de YCloud",
    apiKeyPlaceholder: "yc_...",
    fromPhoneLabel: "Phone Number ID",
    fromPhonePlaceholder: "+34600000000",
  },
] as const;

interface WhatsAppCfg {
  whatsappEnabled: boolean;
  whatsappProvider: string | null;
  whatsappApiKey: string | null;
  whatsappApiKeySet: boolean;
  whatsappApiUrl: string | null;
  whatsappFromPhone: string | null;
}

interface SyncLog {
  id: string;
  event: string;
  email: string;
  status: string;
  message: string | null;
  createdAt: string;
}

interface OrgData {
  apiKey: string | null;
  hrisProvider: string | null;
  hrisSyncEnabled: boolean;
}

export default function IntegrationsPage() {
  const [org, setOrg]               = useState<OrgData | null>(null);
  const [logs, setLogs]             = useState<SyncLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [showKey, setShowKey]       = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // WhatsApp state
  const [waCfg, setWaCfg]               = useState<WhatsAppCfg | null>(null);
  const [waProvider, setWaProvider]     = useState<string | null>(null);
  const [waApiKey, setWaApiKey]         = useState("");
  const [waApiUrl, setWaApiUrl]         = useState("");
  const [waFromPhone, setWaFromPhone]   = useState("");
  const [waEnabled, setWaEnabled]       = useState(false);
  const [waShowKey, setWaShowKey]       = useState(false);
  const [waSaving, setWaSaving]         = useState(false);
  const [waTesting, setWaTesting]       = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const [hrisRes, waRes] = await Promise.all([
        fetch("/api/admin/integrations"),
        fetch("/api/admin/integrations/whatsapp"),
      ]);
      const hrisData = await hrisRes.json();
      const waData   = await waRes.json() as WhatsAppCfg;
      setOrg(hrisData.org);
      setLogs(hrisData.logs ?? []);
      setSelectedProvider(hrisData.org?.hrisProvider ?? null);
      setSyncEnabled(hrisData.org?.hrisSyncEnabled ?? false);
      setWaCfg(waData);
      setWaProvider(waData.whatsappProvider);
      setWaEnabled(waData.whatsappEnabled);
      setWaApiUrl(waData.whatsappApiUrl ?? "");
      setWaFromPhone(waData.whatsappFromPhone ?? "");
      // Don't pre-fill key — show masked placeholder
    } catch {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  async function saveWhatsApp() {
    setWaSaving(true);
    try {
      const payload: Record<string, unknown> = {
        whatsappEnabled:  waEnabled,
        whatsappProvider: waProvider,
        whatsappApiUrl:   waApiUrl.trim() || null,
        whatsappFromPhone: waFromPhone.trim() || null,
      };
      // Only send key if user typed a new one
      if (waApiKey.trim()) payload.whatsappApiKey = waApiKey.trim();

      const res = await fetch("/api/admin/integrations/whatsapp", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setWaApiKey(""); // clear — will show masked on next load
      await fetch_();
      toast.success("Configuración WhatsApp guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setWaSaving(false);
    }
  }

  async function testWhatsApp() {
    setWaTesting(true);
    try {
      const res = await fetch("/api/admin/integrations/whatsapp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      toast.success("¡Mensaje de prueba enviado! Revisa tu WhatsApp.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setWaTesting(false);
    }
  }

  useEffect(() => { fetch_(); }, [fetch_]);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.apiKey) setOrg(o => o ? { ...o, apiKey: data.apiKey } : o);
      else await fetch_();
      toast.success("Guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateKey() {
    setRegenerating(true);
    try {
      await save({ action: "regenerate-key" });
    } finally {
      setRegenerating(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  }

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/hris`
    : "/api/webhooks/hris";

  const provider = PROVIDERS.find(p => p.id === selectedProvider) ?? PROVIDERS[3];

  const statusCounts = {
    success: logs.filter(l => l.status === "success").length,
    error:   logs.filter(l => l.status === "error").length,
    skipped: logs.filter(l => l.status === "skipped").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Plug className="w-6 h-6 text-primary" />
            Integraciones HRIS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sincroniza altas y bajas automáticamente desde tu sistema de RRHH
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sync-toggle" className="text-sm font-medium">
            Sincronización activa
          </Label>
          <Switch
            id="sync-toggle"
            checked={syncEnabled}
            onCheckedChange={v => {
              setSyncEnabled(v);
              save({ hrisSyncEnabled: v, hrisProvider: selectedProvider });
            }}
          />
        </div>
      </div>

      {/* ── WhatsApp ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              Notificaciones WhatsApp
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="wa-toggle" className="text-sm">Activar</Label>
              <Switch
                id="wa-toggle"
                checked={waEnabled}
                onCheckedChange={setWaEnabled}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Envía notificaciones de inscripción, recordatorios y finalización por WhatsApp.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Provider selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Proveedor</p>
            <div className="grid grid-cols-3 gap-2">
              {WA_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setWaProvider(p.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    waProvider === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center text-white font-black text-lg`}>
                    {p.logo}
                  </div>
                  {p.name}
                </button>
              ))}
            </div>
            {waProvider && (
              <p className="text-xs text-muted-foreground mt-2">
                {WA_PROVIDERS.find(p => p.id === waProvider)?.description}
              </p>
            )}
          </div>

          {/* Provider-specific fields */}
          {waProvider && (() => {
            const pCfg = WA_PROVIDERS.find(p => p.id === waProvider);
            if (!pCfg) return null;
            return (
              <div className="space-y-3">
                {/* API Key */}
                <div className="space-y-1.5">
                  <Label className="text-xs">{pCfg.apiKeyLabel}</Label>
                  <div className="flex gap-2">
                    <Input
                      type={waShowKey ? "text" : "password"}
                      placeholder={waCfg?.whatsappApiKeySet ? "••••••••••••••••••••" + (waCfg.whatsappApiKey?.slice(-4) ?? "") : pCfg.apiKeyPlaceholder}
                      value={waApiKey}
                      onChange={e => setWaApiKey(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button size="icon" variant="ghost" onClick={() => setWaShowKey(s => !s)}>
                      {waShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {waCfg?.whatsappApiKeySet && !waApiKey && (
                    <p className="text-[11px] text-green-600">✓ API key guardada — deja en blanco para no cambiarla</p>
                  )}
                </div>

                {/* API URL (Wati only) */}
                {pCfg.fields.apiUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{"apiUrlLabel" in pCfg ? pCfg.apiUrlLabel : "URL del servidor"}</Label>
                    <Input
                      type="url"
                      placeholder={"apiUrlPlaceholder" in pCfg ? pCfg.apiUrlPlaceholder : ""}
                      value={waApiUrl}
                      onChange={e => setWaApiUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}

                {/* From Phone (Wati/YCloud) */}
                {pCfg.fields.fromPhone && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{"fromPhoneLabel" in pCfg ? pCfg.fromPhoneLabel : "Teléfono remitente"}</Label>
                    <Input
                      placeholder={"fromPhonePlaceholder" in pCfg ? pCfg.fromPhonePlaceholder : "+34..."}
                      value={waFromPhone}
                      onChange={e => setWaFromPhone(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Button onClick={saveWhatsApp} disabled={waSaving || !waProvider} className="gap-1.5">
              {waSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Guardar configuración
            </Button>
            <Button
              variant="outline"
              onClick={testWhatsApp}
              disabled={waTesting || !waCfg?.whatsappApiKeySet}
              className="gap-1.5"
            >
              <Send className={`w-3.5 h-3.5 ${waTesting ? "animate-pulse" : ""}`} />
              Enviar mensaje de prueba
            </Button>
          </div>
          {!waCfg?.whatsappApiKeySet && (
            <p className="text-xs text-muted-foreground">Guarda la configuración primero para poder enviar un mensaje de prueba.</p>
          )}
          <p className="text-xs text-muted-foreground">
            El mensaje de prueba se enviará a tu propio número (configúralo en <strong>Perfil → WhatsApp</strong>).
          </p>
        </CardContent>
      </Card>

      {/* ── HRIS ─────────────────────────────────────────────────────────── */}

      {/* Cómo funciona */}
      {!syncEnabled && (
        <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">La sincronización está desactivada</p>
            <p className="text-muted-foreground mt-0.5">
              Actívala arriba para que los webhooks de tu HRIS sean procesados. Con la sincronización activa,
              cada alta en RRHH crea el empleado en Formia e inscribe en el onboarding automáticamente.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* API Key */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              API Key de Formia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Usa esta clave como cabecera <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;key&gt;</code> en todos los webhooks y llamadas a la API.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs bg-muted rounded-lg px-3 py-2.5 truncate text-muted-foreground">
                {org?.apiKey
                  ? (showKey ? org.apiKey : "fmk_" + "•".repeat(40))
                  : "Sin API key — genera una abajo"
                }
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowKey(s => !s)}>
                {showKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              {org?.apiKey && (
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(org.apiKey!, "API Key")}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              onClick={regenerateKey}
              disabled={regenerating}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
              {org?.apiKey ? "Regenerar API key" : "Generar API key"}
            </Button>
            {org?.apiKey && (
              <p className="text-[10px] text-amber-500">
                Si regeneras la key, los webhooks configurados dejarán de funcionar hasta actualizarla.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Webhook URL */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              URL del Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Configura esta URL en tu sistema de RRHH como destino de los eventos de empleados.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs bg-muted rounded-lg px-3 py-2.5 truncate text-foreground">
                {webhookUrl}?provider={selectedProvider ?? "generic"}
              </div>
              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(`${webhookUrl}?provider=${selectedProvider ?? "generic"}`, "URL")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Método: <code className="bg-muted px-1 rounded">POST</code> · Content-Type: <code className="bg-muted px-1 rounded">application/json</code>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Proveedor HRIS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selecciona tu sistema de RRHH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProvider(p.id);
                  save({ hrisProvider: p.id, hrisSyncEnabled: syncEnabled });
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedProvider === p.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center text-white font-black text-lg`}>
                  {p.logo}
                </div>
                {p.name}
              </button>
            ))}
          </div>

          {/* Instrucciones del proveedor seleccionado */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
              {provider.docsUrl && (
                <a href={provider.docsUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline">
                  Docs <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <ol className="space-y-1.5">
              {provider.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span>{step.replace("{apiKey}", org?.apiKey ?? "<tu-api-key>")}</span>
                </li>
              ))}
            </ol>

            {selectedProvider === "generic" && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-1.5">Formato JSON esperado:</p>
                <pre className="bg-background rounded-lg p-3 text-[11px] text-foreground overflow-x-auto">{`{
  "event": "employee.created",
  "data": {
    "email": "maria@gimnasio.com",
    "name": "María García",
    "department": "Monitor",
    "role": "EMPLOYEE"
  }
}`}</pre>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Eventos soportados: <code>employee.created</code> · <code>employee.updated</code> · <code>employee.terminated</code> · <code>employee.reactivated</code>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log de sincronización */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Historial de sincronización
            </CardTitle>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" /> {statusCounts.success}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="w-3 h-3" /> {statusCounts.error}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="w-3 h-3" /> {statusCounts.skipped}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Sin sincronizaciones aún. Cuando tu HRIS envíe un webhook aparecerá aquí.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const isExpanded = expandedLog === log.id;
                const icon =
                  log.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                  log.status === "error"   ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> :
                                            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />;

                return (
                  <div key={log.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                    >
                      {icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            {log.event}
                          </Badge>
                          <span className="text-xs font-medium text-foreground truncate">{log.email}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: es })}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    {isExpanded && log.message && (
                      <div className="px-3 pb-3 pt-1 bg-muted/20 border-t border-border">
                        <p className="text-xs text-foreground">{log.message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentación rápida de la API REST */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">API REST — Referencia rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-muted-foreground">Puedes gestionar empleados directamente desde cualquier sistema vía API REST.</p>
          {[
            { method: "GET",    path: "/api/v1/users",               desc: "Listar empleados activos (filtros: ?department=ID&role=EMPLOYEE)" },
            { method: "POST",   path: "/api/v1/users",               desc: "Crear empleado e inscribir en onboarding automáticamente" },
            { method: "PATCH",  path: "/api/v1/users/:id",           desc: "Actualizar empleado (nombre, email, departamento, rol, isActive)" },
            { method: "DELETE", path: "/api/v1/users/:id",           desc: "Desactivar empleado (soft delete)" },
            { method: "GET",    path: "/api/v1/enrollments",         desc: "Listar inscripciones (filtros: ?userId=&courseId=&status=)" },
          ].map(e => (
            <div key={e.path} className="flex items-start gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 flex-shrink-0 font-mono ${
                  e.method === "GET"    ? "text-blue-600 border-blue-300"   :
                  e.method === "POST"   ? "text-green-600 border-green-300" :
                  e.method === "PATCH"  ? "text-amber-600 border-amber-300" :
                  "text-red-600 border-red-300"
                }`}
              >
                {e.method}
              </Badge>
              <code className="text-foreground flex-shrink-0">{e.path}</code>
              <span className="text-muted-foreground">{e.desc}</span>
            </div>
          ))}
          <p className="text-muted-foreground pt-1">
            Cabecera requerida: <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;api-key&gt;</code>
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
