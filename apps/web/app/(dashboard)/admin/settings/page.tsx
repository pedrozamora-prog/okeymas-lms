import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrgSettingsForm } from "@/components/admin/org-settings-form";
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form";
import { EmailIntegrationsForm } from "@/components/admin/email-integrations-form";
import { ReportScheduleForm } from "@/components/admin/report-schedule-form";
import { SsoSettingsForm } from "@/components/admin/sso-settings-form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Bell, Palette, Plug, BarChart3, KeyRound } from "lucide-react";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string; email?: string };

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
          <Building2 className="w-4 h-4 text-primary" />
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
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Apariencia</h2>
        </div>
        <Card>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color primario</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary border border-border" />
                  <span className="text-sm font-mono text-foreground">#A855F7</span>
                  <Badge variant="outline" className="text-[10px]">Marca Formia</Badge>
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
          <Shield className="w-4 h-4 text-primary" />
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
                  item.status === "próximo"   ? "border-primary/30 text-primary bg-primary/10" :
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

      {/* SSO / SAML 2.0 */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">SSO / SAML 2.0</h2>
        </div>
        <SsoSettingsForm orgSlug={org.slug} />
      </section>

      <Separator />

      {/* Integraciones */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Integraciones</h2>
        </div>

        {/* Email */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Email</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configura el remitente y proveedor de email para los envíos automáticos a empleados.
            </p>
          </div>
          <EmailIntegrationsForm
            orgId={org.id}
            userEmail={user.email ?? ""}
            initialFromName={org.emailFromName ?? ""}
            initialFromAddress={org.emailFromAddress ?? ""}
            initialReplyTo={org.emailReplyTo ?? ""}
            initialResendApiKey={org.resendApiKey ?? ""}
          />
        </div>
      </section>

      <Separator />

      {/* Notificaciones */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Notificaciones por email</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Activa o desactiva los emails automáticos que reciben los empleados.
        </p>
        <NotificationSettingsForm
          orgId={org.id}
          initial={{
            notifyNewEnrollment: org.notifyNewEnrollment,
            notifyDeadline7d:    org.notifyDeadline7d,
            notifyDeadline3d:    org.notifyDeadline3d,
            notifyDeadline1d:    org.notifyDeadline1d,
            notifyOverdue:       org.notifyOverdue,
          }}
        />
      </section>

      <Separator />

      {/* Informes programados */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Informes automáticos</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Recibe un resumen de cumplimiento de formación de forma automática en tu email.
          Se envía a todos los administradores y mánagers de la organización.
        </p>
        <ReportScheduleForm
          orgId={org.id}
          initialFrequency={(org.reportFrequency ?? "DISABLED") as "DISABLED" | "WEEKLY" | "MONTHLY"}
          initialDayOfWeek={org.reportDayOfWeek ?? 1}
          initialDayOfMonth={org.reportDayOfMonth ?? 1}
          lastSentAt={org.reportLastSentAt?.toISOString() ?? null}
        />
      </section>
    </div>
  );
}
