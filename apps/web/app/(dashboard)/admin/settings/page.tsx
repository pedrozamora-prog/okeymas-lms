import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrgSettingsForm } from "@/components/admin/org-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Bell, Palette } from "lucide-react";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string };

  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });

  if (!org) redirect("/dashboard");

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajustes generales de tu organización
        </p>
      </div>

      {/* Organización */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-yelau-yellow" />
          <h2 className="text-base font-semibold text-foreground">Organización</h2>
        </div>
        <OrgSettingsForm
          orgId={org.id}
          initialName={org.name}
          initialSlug={org.slug}
          initialLogoUrl={org.logoUrl ?? ""}
        />
      </section>

      <Separator />

      {/* Apariencia */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-yelau-yellow" />
          <h2 className="text-base font-semibold text-foreground">Apariencia</h2>
        </div>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color primario</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-yelau-yellow border border-border" />
                  <span className="text-sm font-mono text-foreground">#FCE900</span>
                  <Badge variant="outline" className="text-[10px]">Marca Okeymas</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tema</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#0C0C0C] border border-border" />
                  <span className="text-sm font-mono text-foreground">#0C0C0C</span>
                  <Badge variant="outline" className="text-[10px]">Oscuro</Badge>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Los colores de marca se configuran en el código fuente. Contacta con desarrollo para cambiarlos.
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Seguridad */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-yelau-yellow" />
          <h2 className="text-base font-semibold text-foreground">Seguridad</h2>
        </div>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-3">
            {[
              { label: "Autenticación",       value: "Email + Contraseña", status: "activo" },
              { label: "Sesiones JWT",         value: "30 días de validez", status: "activo" },
              { label: "Single Sign-On (SSO)", value: "No configurado",     status: "pendiente" },
              { label: "Autenticación 2FA",    value: "Próximamente",       status: "próximo" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
                <Badge variant="outline" className={
                  item.status === "activo"    ? "border-green-500/30 text-green-400 bg-green-500/10" :
                  item.status === "próximo"   ? "border-yelau-yellow/30 text-yelau-yellow bg-yelau-yellow/10" :
                  "border-border text-muted-foreground"
                }>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Notificaciones */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-yelau-yellow" />
          <h2 className="text-base font-semibold text-foreground">Notificaciones</h2>
        </div>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground">
              Las notificaciones por email se configurarán en una próxima actualización.
              Actualmente los avisos se muestran en tiempo real dentro de la plataforma.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
