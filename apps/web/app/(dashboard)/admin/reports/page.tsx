import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, BookOpen, Trophy, TrendingUp, CheckCircle2, Download } from "lucide-react";
import { ReportExport } from "@/components/admin/report-export";

export const metadata = { title: "Reportes" };

export default async function ReportsPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string };

  if (!["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    completedEnrollments,
    totalPoints,
    coursesWithStats,
    topUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId: user.organizationId } }),
    prisma.course.count({ where: { organizationId: user.organizationId, status: "PUBLISHED" } }),
    prisma.enrollment.count({
      where: { user: { organizationId: user.organizationId } },
    }),
    prisma.enrollment.count({
      where: { user: { organizationId: user.organizationId }, status: "COMPLETED" },
    }),
    prisma.userPoints.aggregate({
      where: { user: { organizationId: user.organizationId } },
      _sum: { total: true },
    }),
    prisma.course.findMany({
      where: { organizationId: user.organizationId, status: "PUBLISHED" },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: { where: { status: "COMPLETED" }, select: { id: true } },
      },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      include: {
        points: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { points: { total: "desc" } },
      take: 5,
    }),
  ]);

  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Reportes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Métricas de formación de tu organización
        </p>
      </div>

      {/* Exportar informes */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-yelau-yellow" />
          <h2 className="text-base font-semibold text-foreground">Exportar informe</h2>
        </div>
        <ReportExport />
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Usuarios activos",     value: totalUsers,        icon: Users,      color: "text-blue-400"        },
          { label: "Cursos publicados",    value: totalCourses,      icon: BookOpen,   color: "text-purple-400"      },
          { label: "Inscripciones totales",value: totalEnrollments,  icon: TrendingUp, color: "text-yelau-yellow"    },
          { label: "Tasa de finalización", value: `${completionRate}%`, icon: CheckCircle2, color: "text-green-400" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top cursos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-yelau-yellow" />
              Cursos más populares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {coursesWithStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            )}
            {coursesWithStats.map((course, idx) => {
              const enrollCount = course._count.enrollments;
              const completedCount = course.enrollments.length;
              const rate = enrollCount > 0 ? Math.round((completedCount / enrollCount) * 100) : 0;
              const maxEnroll = coursesWithStats[0]?._count.enrollments ?? 1;
              const barWidth = Math.round((enrollCount / maxEnroll) * 100);

              return (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-[10px]">{enrollCount} inscritos</Badge>
                      <span className="text-xs text-green-400">{rate}%</span>
                    </div>
                  </div>
                  <Progress value={barWidth} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top usuarios */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yelau-yellow" />
              Ranking de empleados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            )}
            {topUsers.map((u, idx) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className={`text-sm font-black w-5 flex-shrink-0 ${
                  idx === 0 ? "text-yelau-yellow" :
                  idx === 1 ? "text-gray-300" :
                  idx === 2 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {idx + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-yelau-yellow/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-yelau-yellow">
                    {(u.name ?? u.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{u._count.enrollments} cursos</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-foreground">{u.points?.total ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resumen general */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-yelau-yellow" />
            Resumen de actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{completedEnrollments}</p>
              <p className="text-sm text-muted-foreground mt-1">Cursos completados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">
                {totalEnrollments - completedEnrollments}
              </p>
              <p className="text-sm text-muted-foreground mt-1">En progreso</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">
                {totalPoints._sum.total ?? 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Puntos totales ganados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
