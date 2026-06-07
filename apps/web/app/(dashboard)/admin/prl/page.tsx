import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format, differenceInDays, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2, XCircle, HardHat, FileDown, Bell, Sparkles } from "lucide-react";
import Link from "next/link";
import { PrlActions } from "./prl-actions";

export const metadata = { title: "PRL — Prevención de Riesgos Laborales" };

type PrlStatus = "ok" | "warning" | "expired" | "missing";

function getPrlStatus(cert: { issuedAt: Date; expiresAt: Date | null } | null): PrlStatus {
  if (!cert) return "missing";
  if (!cert.expiresAt) return "ok"; // sin caducidad = válido indefinido
  const now = new Date();
  if (cert.expiresAt < now) return "expired";
  if (differenceInDays(cert.expiresAt, now) <= 30) return "warning";
  return "ok";
}

const STATUS_CONFIG = {
  ok:      { label: "En regla",          color: "bg-green-100 text-green-700 border-green-200",  dot: "bg-green-500" },
  warning: { label: "Vence pronto",       color: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  expired: { label: "Vencido",            color: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500" },
  missing: { label: "Sin realizar",       color: "bg-gray-100 text-gray-500 border-gray-200",    dot: "bg-gray-400" },
};

const RISK_LABELS: Record<string, string> = {
  BASICO:     "Básico",
  ESPECIFICO: "Específico",
  DIRECTIVO:  "Directivo",
};

export default async function PrlPage() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  const [prlCourses, employees] = await Promise.all([
    prisma.course.findMany({
      where: { organizationId: user.organizationId, isPrl: true, status: "PUBLISHED" },
      select: { id: true, title: true, prlRiskLevel: true, certificateValidityDays: true },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, isActive: true, role: { in: ["EMPLOYEE", "INSTRUCTOR", "BRANCH_ADMIN", "MANAGER"] } },
      select: { id: true, name: true, email: true, department: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Certificados PRL emitidos
  const certificates = prlCourses.length > 0 ? await prisma.certificate.findMany({
    where: {
      courseId: { in: prlCourses.map(c => c.id) },
      userId:   { in: employees.map(e => e.id) },
    },
    select: { userId: true, courseId: true, issuedAt: true, expiresAt: true },
    orderBy: { issuedAt: "desc" },
  }) : [];

  // Mapa: "userId:courseId" → certificado más reciente
  const certMap = new Map<string, { issuedAt: Date; expiresAt: Date | null }>();
  for (const c of certificates) {
    const key = `${c.userId}:${c.courseId}`;
    if (!certMap.has(key)) certMap.set(key, { issuedAt: c.issuedAt, expiresAt: c.expiresAt });
  }

  // Estadísticas globales
  let totalOk = 0, totalWarning = 0, totalExpired = 0, totalMissing = 0;
  for (const emp of employees) {
    for (const course of prlCourses) {
      const status = getPrlStatus(certMap.get(`${emp.id}:${course.id}`) ?? null);
      if (status === "ok")      totalOk++;
      if (status === "warning") totalWarning++;
      if (status === "expired") totalExpired++;
      if (status === "missing") totalMissing++;
    }
  }
  const total = employees.length * prlCourses.length;
  const pct = total > 0 ? Math.round((totalOk / total) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary" />
            Prevención de Riesgos Laborales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Estado legal de formación PRL por empleado · Ley 31/1995
          </p>
        </div>
        <PrlActions orgId={user.organizationId} hasAlerts={totalWarning + totalExpired > 0} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "En regla",       value: totalOk,      icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Vence en <30d",  value: totalWarning, icon: Clock,        color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Vencidos",       value: totalExpired, icon: XCircle,      color: "text-red-600",    bg: "bg-red-50"    },
          { label: "Sin realizar",   value: totalMissing, icon: AlertTriangle,color: "text-orange-600", bg: "bg-orange-50" },
          { label: "% Cumplimiento", value: `${pct}%`,    icon: ShieldCheck,  color: "text-primary",    bg: "bg-primary/10"},
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {prlCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-6 bg-card rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HardHat className="w-8 h-8 text-primary" />
          </div>
          <div className="max-w-sm">
            <p className="font-bold text-foreground text-lg">Sin cursos PRL configurados</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Todavía no hay ningún curso marcado como formación PRL en tu organización.
              Usa nuestras plantillas oficiales y ten todo listo en menos de 10 minutos.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/admin/prl/templates"
              className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Ver plantillas PRL oficiales
            </Link>
            <Link
              href="/admin/courses"
              className="flex items-center gap-2 bg-muted text-foreground font-medium text-sm px-6 py-3 rounded-xl hover:bg-muted/80 transition-colors"
            >
              Marcar curso existente como PRL
            </Link>
          </div>
          <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
            Las plantillas incluyen la estructura legal correcta (Ley 31/1995), módulos por nivel de riesgo
            y preguntas de evaluación reales. Solo añades tu contenido y publicas.
          </p>
        </div>
      ) : (
        <>
          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className="text-muted-foreground">{v.label}</span>
              </div>
            ))}
          </div>

          {/* Matriz */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 font-semibold text-foreground sticky left-0 bg-muted/40 min-w-[200px]">
                    Empleado
                  </th>
                  {prlCourses.map(c => (
                    <th key={c.id} className="text-left px-4 py-3 font-semibold text-foreground min-w-[180px]">
                      <div className="flex flex-col gap-1">
                        <span className="truncate max-w-[160px]">{c.title}</span>
                        <div className="flex items-center gap-1.5">
                          {c.prlRiskLevel && (
                            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {RISK_LABELS[c.prlRiskLevel] ?? c.prlRiskLevel}
                            </span>
                          )}
                          {c.certificateValidityDays && (
                            <span className="text-[9px] text-muted-foreground">
                              Renueva c/{Math.round(c.certificateValidityDays / 365)}a
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-5 py-3 sticky left-0 bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{emp.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.email}</p>
                        {emp.department?.name && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {emp.department.name}
                          </p>
                        )}
                      </div>
                    </td>
                    {prlCourses.map(course => {
                      const cert = certMap.get(`${emp.id}:${course.id}`) ?? null;
                      const status = getPrlStatus(cert);
                      const cfg = STATUS_CONFIG[status];
                      const daysLeft = cert?.expiresAt ? differenceInDays(cert.expiresAt, new Date()) : null;

                      return (
                        <td key={course.id} className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border w-fit ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                            {cert && (
                              <span className="text-[10px] text-muted-foreground">
                                Realizado: {format(cert.issuedAt, "d MMM yy", { locale: es })}
                              </span>
                            )}
                            {cert?.expiresAt && status !== "missing" && (
                              <span className={`text-[10px] font-medium ${status === "expired" ? "text-red-500" : status === "warning" ? "text-yellow-600" : "text-muted-foreground"}`}>
                                {status === "expired"
                                  ? `Venció ${format(cert.expiresAt, "d MMM yy", { locale: es })}`
                                  : daysLeft !== null && daysLeft <= 30
                                  ? `Vence en ${daysLeft}d`
                                  : `Válido hasta ${format(cert.expiresAt, "d MMM yy", { locale: es })}`
                                }
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aviso legal */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Marco legal aplicable</p>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                Ley 31/1995 de Prevención de Riesgos Laborales · RD 39/1997 Reglamento de los Servicios de Prevención.
                Los empleados con estado "Vencido" o "Sin realizar" suponen un riesgo de sanción de entre <strong>€2.046 y €40.985</strong> por trabajador (art. 40 LISOS).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
