import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge }    from "@/components/ui/badge";
import { Target, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getServerT } from "@/lib/server-t";

export default async function SkillsPage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId?: string };
  if (!user?.id) redirect("/login");
  const t = await getServerT();

  const userRoles = await prisma.userJobRole.findMany({
    where:   { userId: user.id },
    include: {
      jobRole: {
        include: {
          competencies: {
            include: {
              competency: {
                include: {
                  courses: {
                    include: {
                      course: { select: { id: true, title: true, status: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const completedEnrollments = await prisma.enrollment.findMany({
    where:  { userId: user.id, status: "COMPLETED" },
    select: { courseId: true },
  });
  const completedCourseIds = new Set(completedEnrollments.map(e => e.courseId));

  const competencyStatus = userRoles.flatMap(ur =>
    ur.jobRole.competencies.map(rc => {
      const comp    = rc.competency;
      const courses = comp.courses.map(cc => cc.course).filter(c => c.status === "PUBLISHED");
      const done    = courses.filter(c => completedCourseIds.has(c.id)).length;
      const pct     = courses.length > 0 ? Math.round((done / courses.length) * 100) : 100;
      return { comp, courses, done, pct, roleName: ur.jobRole.name };
    })
  );

  const totalComps  = competencyStatus.length;
  const mastered    = competencyStatus.filter(c => c.pct === 100).length;
  const inProgress  = competencyStatus.filter(c => c.pct > 0 && c.pct < 100).length;
  const notStarted  = competencyStatus.filter(c => c.pct === 0 && c.courses.length > 0).length;
  const globalScore = totalComps > 0 ? Math.round((mastered / totalComps) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t("nav.skills")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Progreso hacia las competencias requeridas para tu puesto
        </p>
      </div>

      {userRoles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Sin puesto asignado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tu responsable aún no te ha asignado un puesto de trabajo
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("dashboard.completed"), value: mastered,   color: "text-green-400",    icon: CheckCircle2 },
              { label: t("dashboard.inProgress"),value: inProgress, color: "text-yelau-yellow", icon: BookOpen     },
              { label: "Sin empezar",             value: notStarted, color: "text-red-400",      icon: AlertCircle  },
              { label: "Puntuación",              value: `${globalScore}%`, color: "text-blue-400", icon: Target   },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className="text-xl font-black text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Progreso global</span>
                <span className="text-yelau-yellow font-black">{globalScore}%</span>
              </div>
              <Progress value={globalScore} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {mastered} de {totalComps} competencias completadas
              </p>
            </CardContent>
          </Card>

          {userRoles.map(ur => (
            <div key={ur.jobRole.id} className="space-y-3">
              <Badge variant="outline" className="text-xs">{ur.jobRole.name}</Badge>

              {ur.jobRole.competencies.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2">
                  Este puesto no tiene competencias asignadas todavía
                </p>
              ) : (
                <div className="space-y-3">
                  {ur.jobRole.competencies.map(rc => {
                    const status = competencyStatus.find(c => c.comp.id === rc.competency.id);
                    if (!status) return null;
                    const pendingCourses = status.courses.filter(c => !completedCourseIds.has(c.id));

                    return (
                      <Card key={rc.competency.id} className={
                        status.pct === 100 ? "border-green-500/30 bg-green-500/5" :
                        status.pct > 0     ? "border-yelau-yellow/30" : "border-red-500/20"
                      }>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                              <span>{rc.competency.name}</span>
                            </div>
                            <span className={`text-sm font-black ${
                              status.pct === 100 ? "text-green-400" :
                              status.pct > 0     ? "text-yelau-yellow" : "text-red-400"
                            }`}>{status.pct}%</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3 space-y-2">
                          {status.courses.length > 0 && <Progress value={status.pct} className="h-1.5" />}
                          {status.courses.length === 0 && (
                            <p className="text-xs text-muted-foreground">Sin cursos asignados</p>
                          )}
                          {pendingCourses.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {t("courses.continue")}
                              </p>
                              {pendingCourses.map(course => (
                                <Link
                                  key={course.id}
                                  href={`/dashboard/courses/${course.id}`}
                                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                >
                                  <BookOpen className="w-3 h-3 flex-shrink-0 group-hover:text-yelau-yellow" />
                                  <span className="truncate">{course.title}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
