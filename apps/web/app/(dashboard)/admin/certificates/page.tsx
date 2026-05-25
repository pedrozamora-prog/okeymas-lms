import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, User, BookOpen, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { IssueCertificateForm } from "@/components/admin/issue-certificate-form";
import { RevokeCertificateButton } from "@/components/admin/revoke-certificate-button";

export const metadata = { title: "Certificados — Admin" };

const typeLabel: Record<string, string> = {
  COMPLETION:   "Finalización",
  PROFESSIONAL: "Profesional",
};
const typeColor: Record<string, string> = {
  COMPLETION:   "border-blue-500/30 text-blue-400 bg-blue-500/10",
  PROFESSIONAL: "border-yelau-yellow/30 text-yelau-yellow bg-yelau-yellow/10",
};

export default async function AdminCertificatesPage() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string };

  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  const [certificates, users, courses] = await Promise.all([
    prisma.certificate.findMany({
      where: { user: { organizationId: user.organizationId } },
      include: {
        user:   { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      where: { organizationId: user.organizationId, status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const stats = {
    total:        certificates.length,
    completion:   certificates.filter(c => c.type === "COMPLETION").length,
    professional: certificates.filter(c => c.type === "PROFESSIONAL").length,
    expired:      certificates.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Certificados</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Todos los certificados emitidos en tu organización
          </p>
        </div>
        <IssueCertificateForm users={users} courses={courses} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total emitidos",   value: stats.total,        color: "text-foreground",   bg: "bg-muted" },
          { label: "Finalización",     value: stats.completion,   color: "text-blue-400",     bg: "bg-blue-500/10" },
          { label: "Profesionales",    value: stats.professional, color: "text-yelau-yellow", bg: "bg-yelau-yellow/10" },
          { label: "Expirados",        value: stats.expired,      color: "text-red-400",      bg: "bg-red-500/10" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.bg} flex-shrink-0`}>
                <Award className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Award className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-foreground">No hay certificados emitidos</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Emite uno manualmente con el botón de arriba, o activa los certificados en la configuración de un curso para emisión automática.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {certificates.map(cert => {
            const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
            return (
              <Card key={cert.id} className={isExpired ? "opacity-60" : "hover:border-yelau-yellow/20 transition-colors"}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      cert.type === "PROFESSIONAL" ? "bg-yelau-yellow/10" : "bg-blue-500/10"
                    }`}>
                      <Award className={`w-4 h-4 ${cert.type === "PROFESSIONAL" ? "text-yelau-yellow" : "text-blue-400"}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{cert.user.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BookOpen className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{cert.courseTitle}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {format(cert.issuedAt, "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>

                    {/* Badges + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={`text-[10px] hidden sm:flex ${typeColor[cert.type]}`}>
                        {typeLabel[cert.type]}
                      </Badge>
                      {isExpired && (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/10 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Expirado
                        </Badge>
                      )}
                      {cert.expiresAt && !isExpired && (
                        <span className="text-[10px] text-muted-foreground hidden md:block">
                          Válido hasta {format(cert.expiresAt, "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                      <RevokeCertificateButton certId={cert.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
