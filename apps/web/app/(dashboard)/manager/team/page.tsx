import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, CheckCircle2, Clock, Award } from "lucide-react";

export const metadata = { title: "Mi equipo" };

const DEPT_LABELS: Record<string, string> = {
  ADMINISTRACION: "Administración",
  RECEPCION:      "Recepción",
  LIMPIEZA:       "Limpieza",
  MONITOR:        "Monitor",
  DEPORTIVO:      "Deportivo",
};

export default async function ManagerTeamPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || user.role !== "MANAGER") redirect("/dashboard");

  // Obtener datos del mánager para conocer su departamento
  const manager = await prisma.user.findUnique({
    where: { id: user.id },
    select: { department: true, name: true },
  });

  // Empleados del mismo departamento
  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      isActive:       true,
      role:           "EMPLOYEE",
      ...(manager?.department ? { department: manager.department } : {}),
    },
    include: {
      enrollments: {
        include: { course: { select: { title: true, isRequired: true } } },
        orderBy: { enrolledAt: "desc" },
      },
      certificates: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  const totalEnrollments = teamMembers.reduce((acc, m) => acc + m.enrollments.length, 0);
  const totalCompleted   = teamMembers.reduce((acc, m) => acc + m.enrollments.filter(e => e.status === "COMPLETED").length, 0);
  const totalCerts       = teamMembers.reduce((acc, m) => acc + m.certificates.length, 0);
  const overdueCount     = teamMembers.reduce((acc, m) => acc + m.enrollments.filter(e => e.status === "EXPIRED").length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-yelau-yellow" />
          Mi equipo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {manager?.department ? DEPT_LABELS[manager.department] ?? manager.department : "Todos los departamentos"} · {teamMembers.length} empleados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Empleados",      value: teamMembers.length, icon: Users,        color: "text-blue-500",   bg: "bg-blue-50"   },
          { label: "Completados",    value: totalCompleted,     icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Vencidos",       value: overdueCount,       icon: Clock,        color: "text-red-500",    bg: "bg-red-50"    },
          { label: "Certificados",   value: totalCerts,         icon: Award,        color: "text-yelau-yellow",bg: "bg-yelau-yellow/10" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de empleados */}
      {teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <Users className="w-10 h-10 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No hay empleados en tu equipo</p>
          <p className="text-sm text-muted-foreground">Los empleados de tu departamento aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teamMembers.map(member => {
            const total     = member.enrollments.length;
            const completed = member.enrollments.filter(e => e.status === "COMPLETED").length;
            const overdue   = member.enrollments.filter(e => e.status === "EXPIRED").length;
            const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
            const requiredPending = member.enrollments.filter(
              e => e.course.isRequired && e.status !== "COMPLETED"
            ).length;

            return (
              <div key={member.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-yelau-yellow/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-yelau-yellow">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{member.name}</p>
                      {overdue > 0 && (
                        <Badge className="bg-red-100 text-red-600 border-red-200 text-[10px]">
                          {overdue} vencido{overdue > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {requiredPending > 0 && (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 text-[10px]">
                          {requiredPending} obligatorio{requiredPending > 1 ? "s" : ""} pendiente{requiredPending > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {completed === total && total > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                          ✓ Al día
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>

                    {/* Progreso */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{completed} de {total} cursos completados</span>
                        <span className="text-xs font-semibold text-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>

                    {/* Cursos recientes */}
                    {member.enrollments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {member.enrollments.slice(0, 4).map(enroll => (
                          <span
                            key={enroll.id}
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                              enroll.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                              enroll.status === "EXPIRED"   ? "bg-red-50 text-red-600 border-red-200" :
                              "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            <BookOpen className="w-2.5 h-2.5" />
                            {enroll.course.title.length > 25
                              ? enroll.course.title.slice(0, 25) + "…"
                              : enroll.course.title}
                          </span>
                        ))}
                        {member.enrollments.length > 4 && (
                          <span className="text-[10px] text-muted-foreground px-2 py-0.5">
                            +{member.enrollments.length - 4} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Certificados */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-yelau-yellow">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-bold">{member.certificates.length}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">cert.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
