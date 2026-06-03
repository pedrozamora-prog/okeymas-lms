"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, ExternalLink, Copy } from "lucide-react";

interface Props {
  orgSlug: string;
}

interface SsoConfig {
  isEnabled: boolean;
  idpEntityId: string;
  idpSsoUrl: string;
  idpCertificate: string;
}

export function SsoSettingsForm({ orgSlug }: Props) {
  const appUrl     = typeof window !== "undefined" ? window.location.origin : "";
  const metaUrl    = `${appUrl}/api/auth/sso/${orgSlug}/metadata`;
  const acsUrl     = `${appUrl}/api/auth/sso/${orgSlug}/callback`;
  const initUrl    = `${appUrl}/api/auth/sso/${orgSlug}/init`;

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [enabled,  setEnabled]  = useState(false);
  const [entityId, setEntityId] = useState("");
  const [ssoUrl,   setSsoUrl]   = useState("");
  const [cert,     setCert]     = useState("");

  useEffect(() => {
    fetch("/api/admin/sso")
      .then(r => r.json())
      .then(d => {
        if (d) {
          setEnabled(d.isEnabled);
          setEntityId(d.idpEntityId);
          setSsoUrl(d.idpSsoUrl);
          setCert(d.idpCertificate);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (enabled && (!entityId || !ssoUrl || !cert)) {
      toast.error("Rellena todos los campos del IdP para activar SSO");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: enabled, idpEntityId: entityId, idpSsoUrl: ssoUrl, idpCertificate: cert }),
    });
    if (res.ok) toast.success("Configuración SSO guardada");
    else toast.error("Error al guardar");
    setSaving(false);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  }

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
        <div>
          <p className="text-sm font-medium text-foreground">SSO / SAML 2.0</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permite a los empleados autenticarse con el proveedor de identidad corporativo (Okta, Azure AD, Workday…)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enabled && <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>}
          <button type="button" onClick={() => setEnabled(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-yelau-yellow" : "bg-muted-foreground/30"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* SP info (for IdP registration) */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Datos del SP (copia en tu IdP)
          </p>
          <div className="space-y-2">
            {[
              { label: "Entity ID (SP)", value: `${appUrl}/api/auth/sso/sp` },
              { label: "ACS URL (Callback)", value: acsUrl },
              { label: "Metadata URL", value: metaUrl },
              { label: "Login URL (para tests)", value: initUrl },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-xs text-foreground font-mono truncate">{value}</p>
                </div>
                <button onClick={() => copy(value)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a href={label === "Metadata URL" ? value : undefined} target="_blank" rel="noopener noreferrer"
                  className={`text-muted-foreground hover:text-foreground flex-shrink-0 ${label !== "Metadata URL" ? "pointer-events-none opacity-0" : ""}`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IdP config */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configuración del IdP
        </p>

        <div className="space-y-1.5">
          <Label className="text-xs">IdP Entity ID</Label>
          <Input value={entityId} onChange={e => setEntityId(e.target.value)}
            placeholder="https://idp.empresa.com/saml/metadata" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">IdP SSO URL (entry point)</Label>
          <Input value={ssoUrl} onChange={e => setSsoUrl(e.target.value)}
            placeholder="https://idp.empresa.com/saml/sso" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Certificado del IdP (PEM, sin cabeceras)</Label>
          <textarea value={cert} onChange={e => setCert(e.target.value)} rows={5}
            placeholder="MIICpDCCAYwCCQDU..."
            className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-muted/30 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50 resize-none" />
          <p className="text-[10px] text-muted-foreground">
            Pega solo el contenido del certificado, sin -----BEGIN CERTIFICATE----- ni -----END CERTIFICATE-----
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}
        className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar configuración SSO
      </Button>

      {enabled && entityId && ssoUrl && cert && (
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          SSO configurado. Los usuarios pueden entrar en <strong>/login</strong> con el botón SSO usando el slug <strong>{orgSlug}</strong>.
        </div>
      )}
    </div>
  );
}
