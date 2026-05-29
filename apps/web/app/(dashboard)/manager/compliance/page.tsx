import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Clock, User, BookOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Cumplimiento — Mi equipo" };

export default async function ManagerCompliancePage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || user.role !== "MANAGER") redirect("/dashboard");

  const manager = await prisma.user.findUnique({
    where: { id: user.id },
    select: { department: true },
  });

  const requiredCourses = await prisma.course.findMany({
    where: { organizationId: user.organizationId, isRequired: true, status: "PUBLISHED" },
    select: { id: true, title: true, daysToComplete: true },
    orderBy: { title: "asc" },
  });

  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      isActive:       true,
      role:           "EMPLOYEE",
      ...(manager?.department ? { department: manager.department } : {}),
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: { in: requiredCourses.map(c => c.id) },
      userId:   { in: teamMembers.map(e => e.id) },
    },
    select: { userId: true, courseId: true, status: true, completedAt: true, deadline: true },
  });

  const enrollMap = new Map(enrollments.map(e => [`${e.userId}:${e.courseId}`, e]));
  const now = new Date();

  const totalRequired  = teamMembers.length * requiredCourses.length;
  const totalCompleted = enrollments.filter(e => e.status === "COMPLETED").length;
  const totalOverdue   = enrollments.filter(e => e.status !== "COMPLETED" && e.deadline && new Date(e.deadline) < now).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-yelau-yellow" />
          Cumplimiento de formación
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Estado de cursos obligatorios en tu equipo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Completados",    value: totalCompleted, color: "text-green-600", bg: "bg-green-50",  icon: ShieldCheck    },
          { label: "Vencidos",       value: totalOverdue,   color: "text-red-500",   bg: "bg-red-50",    icon: AlertTriangle  },
          { label: "% Cumplimiento", value: totalRequired > 0 ? `${Math.round((totalCompleted / totalRequired) * 100)}%` : "—",
            color: "text-blue-600",  bg: "bg-blue-50",   icon: BookOpen },
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

      {requiredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <BookOpen className="w-10 h-10 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No hay cursos obligatorios configurados</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground">Empleado</th>
                {requiredCourses.map(c => (
                  <th key={c.id} className="text-left px-4 py-3 font-semibold text-foreground min-w-[150px]">
                    <span className="truncate block max-w-[130px]">{c.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((emp, i) => (
                <tr key={emp.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-yelau-yellow/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-yelau-yellow" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  {requiredCourses.map(course => {
                    const enroll = enrollMap.get(`${emp.id}:${course.id}`);
                    if (!enroll) return (
                      <td key={course.id} className="px-4 py-3">
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 text-[10px]">Sin inscribir</Badge>
                      </td>
                    );
                    if (enroll.status === "COMPLETED") return (
                      <td key={course.id} className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] w-fit">✓ Completado</Badge>
                          {enroll.completedAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(enroll.completedAt), "d MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                    const isOverdue = enroll.deadline && new Date(enroll.deadline) < now;
                    const daysLeft  = enroll.deadline ? differenceInDays(new Date(enroll.deadline), now) : null;
                    return (
                      <td key={course.id} className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className={`text-[10px] w-fit ${isOverdue ? "text-red-500 border-red-200 bg-red-50" : "text-blue-500 border-blue-200 bg-blue-50"}`}>
                            {isOverdue ? "⚠ Vencido" : "En progreso"}
                          </Badge>
                          {daysLeft !== null && !isOverdue && (
                            <span className="text-[10px] text-muted-foreground">{daysLeft}d restantes</span>
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
      )}
    </div>
  );
}
