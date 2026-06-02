"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, Eye, EyeOff, CheckCircle2, Mail } from "lucide-react";

interface Props {
  orgId:              string;
  userEmail:          string;
  initialFromName:    string;
  initialFromAddress: string;
  initialReplyTo:     string;
  initialResendApiKey: string;
}

export function EmailIntegrationsForm({
  orgId,
  userEmail,
  initialFromName,
  initialFromAddress,
  initialReplyTo,
  initialResendApiKey,
}: Props) {
  const [fromName,    setFromName]    = useState(initialFromName);
  const [fromAddress, setFromAddress] = useState(initialFromAddress);
  const [replyTo,     setReplyTo]     = useState(initialReplyTo);
  const [apiKey,      setApiKey]      = useState(initialResendApiKey);
  const [showKey,     setShowKey]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [saved,       setSaved]       = useState(false);

  const usingPlatform = !apiKey.trim();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailFromName:    fromName    || null,
          emailFromAddress: fromAddress || null,
          emailReplyTo:     replyTo     || null,
          resendApiKey:     apiKey      || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      toast.success("Configuración de email guardada");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}/test-email`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:               userEmail,
          emailFromName:    fromName    || null,
          emailFromAddress: fromAddress || null,
          emailReplyTo:     replyTo     || null,
          resendApiKey:     apiKey      || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al enviar");
      toast.success(`Email de prueba enviado a ${userEmail}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar email de prueba");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Estado del proveedor */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${usingPlatform ? "bg-yelau-yellow" : "bg-green-500"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {usingPlatform ? "Usando cuenta de FitAcademy" : "Usando tu cuenta Resend"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {usingPlatform
                  ? "Los emails salen desde noreply@fitacademy.com. Configura tu propia API key para enviar desde tu dominio."
                  : "Los emails salen desde tu propia cuenta Resend con tu dominio verificado."}
              </p>
            </div>
            <Badge variant="outline" className={usingPlatform
              ? "text-[10px] border-yelau-yellow/30 text-yelau-yellow bg-yelau-yellow/10"
              : "text-[10px] border-green-500/30 text-green-400 bg-green-500/10"
            }>
              {usingPlatform ? "Compartido" : "Propio"}
            </Badge>
          </div>

          {/* Remitente */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Remitente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="from-name">Nombre del remitente</Label>
                <Input
                  id="from-name"
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  placeholder="Ej: Mi Gimnasio"
                />
                <p className="text-[11px] text-muted-foreground">Aparece como "De:" en el email</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="from-address">Email de envío</Label>
                <Input
                  id="from-address"
                  type="email"
                  value={fromAddress}
                  onChange={e => setFromAddress(e.target.value)}
                  placeholder="formacion@tudominio.com"
                />
                <p className="text-[11px] text-muted-foreground">Requiere dominio verificado en Resend</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reply-to">Email de respuesta (Reply-To)</Label>
              <Input
                id="reply-to"
                type="email"
                value={replyTo}
                onChange={e => setReplyTo(e.target.value)}
                placeholder="rrhh@tudominio.com"
                className="max-w-sm"
              />
              <p className="text-[11px] text-muted-foreground">Opcional. Hacia dónde van las respuestas de los empleados</p>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">API Key de Resend (opcional)</p>
            <div className="space-y-1.5">
              <Label htmlFor="api-key">Resend API Key</Label>
              <div className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="re_xxxxxxxxxxxx"
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Consíguela en{" "}
                <span className="font-mono text-foreground">resend.com/api-keys</span>.
                Se almacena de forma segura y nunca se muestra completa.
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : saved
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Save className="w-4 h-4" />
              }
              {saved ? "¡Guardado!" : "Guardar configuración"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={testing}
              onClick={handleTest}
              className="gap-2"
            >
              {testing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              Enviar email de prueba
            </Button>

            <p className="text-[11px] text-muted-foreground">
              El email de prueba se enviará a <span className="font-medium text-foreground">{userEmail}</span>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
