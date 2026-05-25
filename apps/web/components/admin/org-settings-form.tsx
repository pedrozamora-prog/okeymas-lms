"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Building2 } from "lucide-react";

interface OrgSettingsFormProps {
  orgId: string;
  initialName: string;
  initialSlug: string;
  initialLogoUrl: string;
}

export function OrgSettingsForm({ orgId, initialName, initialSlug, initialLogoUrl }: OrgSettingsFormProps) {
  const [name, setName]       = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      toast.success("Configuración guardada");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="org-name">
                Nombre de la organización <span className="text-red-400">*</span>
              </Label>
              <Input
                id="org-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Okeymas Group"
              />
            </div>

            {/* Slug (solo lectura) */}
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Identificador interno</Label>
              <Input
                id="org-slug"
                value={initialSlug}
                readOnly
                disabled
                className="font-mono opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">No editable. Usado en URLs internas.</p>
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="logo-url">URL del logotipo</Label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://tu-dominio.com/logo.png"
                  type="url"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  PNG o SVG recomendado. Se mostrará en el sidebar y los certificados.
                </p>
              </div>
              {/* Preview */}
              <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {saved ? "¡Guardado!" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
