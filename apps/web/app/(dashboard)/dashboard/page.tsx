import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Trophy, Video, Award, Users, TrendingUp, BarChart3, GraduationCap, AlertTriangle, Flame, ArrowRight, PlayCircle, Star } from "lucide-react";
import { AlertsWidget } from "@/components/admin/alerts-widget";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getServerT } from "@/lib/server-t";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { id: string; name?: string | null; role?: string; organizationId?: string };
  const firstName = user?.name?.split(" ")[0] ?? "Campeón";
  const isAdmin      = ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user?.role ?? "");
  const isInstructor = user?.role === "INSTRUCTOR";
  const t = await getServerT();

  // ── VISTA ADMIN ─────────────────────────────────────────────────────────
  if (isAdmin) {
    const [
      totalUsers, totalCourses, totalEnrollments,
      completedEnrollments, totalCertificates,
      upcomingClasses, recentEnrollments, topCourses,
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: user.organizationId!, isActive: true } }),
      prisma.course.count({ where: { organizationId: user.organizationId!, status: "PUBLISHED" } }),
      prisma.enrollment.count({ where: { course: { organizationId: user.organizationId! } } }),
      prisma.enrollment.count({ where: { course: { organizationId: user.organizationId! }, status: "COMPLETED" } }),
      prisma.certificate.count({ where: { user: { organizationId: user.organizationId! } } }),
      prisma.liveClass.findMany({
        where: { organizationId: user.organizationId!, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 3,
        include: { instructor: { select: { name: true } } },
      }),
      prisma.enrollment.findMany({
        where: { course: { organizationId: user.organizationId! } },
        orderBy: { enrolledAt: "desc" },
        take: 5,
        include: {
          user:   { select: { name: true } },
          course: { select: { title: true } },
        },
      }),
      prisma.course.findMany({
        where: { organizationId: user.organizationId!, status: "PUBLISHED" },
        include: { _count: { select: { enrollments: true } } },
        orderBy: { enrollments: { _count: "desc" } },
        take: 5,
      }),
    ]);

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    const adminStats = [
      { label: t("admin.activeUsers"),       value: String(totalUsers),             icon: Users,         color: "text-primary", bg: "bg-primary/10" },
      { label: t("admin.publishedCourses"),  value: String(totalCourses),           icon: BookOpen,      color: "text-blue-400",     bg: "bg-blue-500/10"     },
      { label: t("admin.totalEnrollments"),  value: String(totalEnrollments),       icon: GraduationCap, color: "text-purple-400",   bg: "bg-purple-500/10"   },
      { label: t("admin.completedCourses"),  value: String(completedEnrollments),   icon: CheckCircle,   color: "text-green-400",    bg: "bg-green-500/10"    },
      { label: t("admin.issuedCertificates"),value: String(totalCertificates),      icon: Award,         color: "text-orange-400",   bg: "bg-orange-500/10"   },
      { label: t("admin.completionRate"),    value: `${completionRate}%`,           icon: TrendingUp,    color: "text-primary", bg: "bg-primary/10" },
    ];

    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-black text-foreground tracking-tight" style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}>
            {t("admin.panelTitle")} 📊
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {t("admin.panelSubtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {adminStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="transition-colors hover:border-border/80">
                <CardContent className="flex items-center gap-4 pt-6 pb-6">
                  <div className={`p-3 rounded-xl ${stat.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Cursos más populares */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
                {t("admin.topCourses")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("admin.noPublishedCourses")}</p>
              ) : topCourses.map((course, i) => (
                <div key={course.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={totalEnrollments > 0 ? (course._count.enrollments / totalUsers) * 100 : 0}
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {course._count.enrollments} {t("admin.enrolled")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                {t("admin.recentEnrollments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("admin.noRecentActivity")}</p>
              ) : recentEnrollments.map((e) => (
                <div key={`${e.userId}-${e.courseId}`} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-yelau-black text-xs font-bold">
                      {e.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.course.title}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {format(e.enrolledAt, "d MMM", { locale: es })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Widget alertas de riesgo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0" />
                {t("admin.atRiskEmployees")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsWidget />
          </CardContent>
        </Card>

        {/* Próximas clases */}
        {upcomingClasses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
                {t("admin.upcomingClasses")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingClasses.map(cls => (
                <div key={cls.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cls.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(cls.scheduledAt, "d MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── VISTA INSTRUCTOR ─────────────────────────────────────────────────────
  if (isInstructor) {
    const [myCourses, myClasses] = await Promise.all([
      prisma.course.findMany({
        where: { organizationId: user.organizationId! },
        include: {
          enrollments: {
            include: { user: { select: { name: true } } },
          },
          modules: { include: { lessons: { select: { id: true } } } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { order: "asc" },
      }),
      prisma.liveClass.findMany({
        where: { instructorId: user.id, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
    ]);

    const totalAlumnos    = new Set(myCourses.flatMap(c => c.enrollments.map(e => e.userId))).size;
    const totalInscritos  = myCourses.reduce((s, c) => s + c._count.enrollments, 0);
    const totalLessons    = myCourses.reduce((s, c) => s + c.modules.flatMap(m => m.lessons).length, 0);

    // Progreso real de alumnos en cada curso
    const allLessonIds = myCourses.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id)));
    const progressData = allLessonIds.length > 0
      ? await prisma.lessonProgress.groupBy({
          by: ["lessonId"],
          where: { lessonId: { in: allLessonIds }, completed: true },
          _count: { lessonId: true },
        })
      : [];
    const completedByLesson = new Map(progressData.map(p => [p.lessonId, p._count.lessonId]));

    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-black text-foreground tracking-tight" style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}>
            {t("dashboard.hello", { name: firstName })} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {t("admin.panelSubtitle")}
          </p>
        </div>

        {/* Stats instructor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: t("admin.publishedCourses"),  value: String(myCourses.length),  icon: BookOpen,      color: "text-primary", bg: "bg-primary/10" },
            { label: t("admin.activeUsers"),        value: String(totalAlumnos),      icon: Users,         color: "text-blue-400",     bg: "bg-blue-500/10"     },
            { label: t("admin.totalEnrollments"),   value: String(totalInscritos),    icon: GraduationCap, color: "text-purple-400",   bg: "bg-purple-500/10"   },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="transition-colors hover:border-border/80">
                <CardContent className="flex items-center gap-4 pt-6 pb-6">
                  <div className={`p-3 rounded-xl ${s.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground leading-none">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mis cursos con progreso de alumnos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {t("nav.myCourses")}
              </span>
              <Link href="/admin/courses" className="text-xs text-brand hover:underline font-normal">
                {t("admin.manageCourses")} →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("admin.noPublishedCourses")}</p>
            ) : myCourses.map(course => {
              const lessonIds  = course.modules.flatMap(m => m.lessons.map(l => l.id));
              const totalLess  = lessonIds.length;
              const completions = lessonIds.reduce((s, id) => s + (completedByLesson.get(id) ?? 0), 0);
              const maxPossible = totalLess * course._count.enrollments;
              const avgProgress = maxPossible > 0 ? Math.round((completions / maxPossible) * 100) : 0;

              return (
                <div key={course.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{course._count.enrollments} {t("admin.enrolled")}</span>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Badge variant="outline" className="text-[10px] hover:border-primary/40 cursor-pointer transition-colors">{t("common.edit")}</Badge>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={avgProgress} className="h-1.5 flex-1" />
                    <span className="text-xs text-brand font-bold w-10 text-right">{avgProgress}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Progreso medio de los alumnos</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Próximas clases que imparte */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Video className="w-4 h-4 text-primary flex-shrink-0" />
              {t("admin.upcomingClasses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Video className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noClasses")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cls.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(cls.scheduledAt, "d MMM · HH:mm", { locale: es })} · {cls.durationMins}min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── VISTA ALUMNO ──────────────────────────────────────────────────────────
  const [enrollments, userPoints, certificates, upcomingClasses, recentActivity] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: { lessons: { select: { id: true, title: true, order: true }, orderBy: { order: "asc" } } },
            },
          },
        },
      },
    }),
    prisma.userPoints.findUnique({ where: { userId: user.id } }),
    prisma.certificate.count({ where: { userId: user.id } }),
    prisma.liveClass.findMany({
      where: { scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      include: { instructor: { select: { name: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, completed: true, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 400,
    }),
  ]);

  const allLessonIds = enrollments.flatMap(e =>
    e.course.modules.flatMap(m => m.lessons.map(l => l.id))
  );
  const completedProgress = allLessonIds.length > 0
    ? await prisma.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: allLessonIds }, completed: true },
        select: { lessonId: true },
      })
    : [];

  const completedSet = new Set(completedProgress.map(p => p.lessonId));
  const courseStats = enrollments.map(e => {
    const lessonIds = e.course.modules.flatMap(m => m.lessons.map(l => l.id));
    const done = lessonIds.filter(id => completedSet.has(id)).length;
    return { enrollment: e, total: lessonIds.length, done };
  });

  const totalEnrolled   = enrollments.length;
  const totalCompleted  = courseStats.filter(c => c.total > 0 && c.done === c.total).length;
  const totalLessons    = courseStats.reduce((s, c) => s + c.total, 0);
  const totalDone       = courseStats.reduce((s, c) => s + c.done, 0);
  const globalProgress  = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;
  const inProgressCourses = courseStats.filter(c => c.done > 0 && c.done < c.total).slice(0, 3);

  // ── Streak de actividad ────────────────────────────────────────────────────
  const activityDays = new Set(
    recentActivity.map(p => p.completedAt!.toISOString().split("T")[0])
  );
  let streak = 0;
  {
    const todayUtc = new Date();
    todayUtc.setHours(0, 0, 0, 0);
    const todayStr     = todayUtc.toISOString().split("T")[0];
    const yesterdayUtc = new Date(todayUtc);
    yesterdayUtc.setDate(yesterdayUtc.getDate() - 1);
    const yesterdayStr = yesterdayUtc.toISOString().split("T")[0];

    if (activityDays.has(todayStr) || activityDays.has(yesterdayStr)) {
      const check = new Date(activityDays.has(todayStr) ? todayUtc : yesterdayUtc);
      while (activityDays.has(check.toISOString().split("T")[0])) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }
  }

  // ── Próxima lección (primer incompleta del curso con más progreso) ─────────
  const bestCourse = courseStats
    .filter(c => c.done < c.total)
    .sort((a, b) => {
      const pA = a.total > 0 ? a.done / a.total : 0;
      const pB = b.total > 0 ? b.done / b.total : 0;
      return pB - pA;
    })[0];

  let nextLesson: { id: string; title: string; moduleTitle: string; courseId: string; courseTitle: string } | null = null;
  if (bestCourse) {
    outer: for (const mod of bestCourse.enrollment.course.modules) {
      for (const lesson of mod.lessons) {
        if (!completedSet.has(lesson.id)) {
          nextLesson = {
            id: lesson.id,
            title: lesson.title,
            moduleTitle: mod.title,
            courseId: bestCourse.enrollment.courseId,
            courseTitle: bestCourse.enrollment.course.title,
          };
          break outer;
        }
      }
    }
  }
  const nextPct = bestCourse && bestCourse.total > 0
    ? Math.round((bestCourse.done / bestCourse.total) * 100)
    : 0;

  return (
    <div className="space-y-6 lg:space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-black text-foreground tracking-tight" style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}>
            {t("dashboard.hello", { name: firstName })} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {globalProgress === 100
              ? "¡Has completado todo tu formación! 🎉"
              : globalProgress > 0
              ? `Llevas un ${globalProgress}% de tu formación — ¡sigue así!`
              : t("dashboard.subtitle")}
          </p>
        </div>
        {streak >= 2 && (
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400">{streak}</span>
            <span className="text-xs text-orange-400/80">días</span>
          </div>
        )}
      </div>

      {/* Banner "continúa donde lo dejaste" */}
      {nextLesson ? (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Continúa donde lo dejaste</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{nextLesson.courseTitle} · {nextLesson.moduleTitle}</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">{nextLesson.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={nextPct} className="h-1.5 flex-1 max-w-[200px]" />
                <span className="text-xs font-bold text-primary">{nextPct}%</span>
                <span className="text-xs text-muted-foreground">{bestCourse?.done} / {bestCourse?.total} lecciones</span>
              </div>
            </div>
            <Button asChild size="sm" className="flex-shrink-0 gap-1.5">
              <Link href={`/dashboard/courses/${nextLesson.courseId}/lessons/${nextLesson.id}`}>
                Continuar
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      ) : totalEnrolled === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">{t("dashboard.noEnrollments")}</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/courses">{t("nav.myCourses")}</Link>
          </Button>
        </div>
      ) : null}

      {/* Stats: 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: t("dashboard.coursesEnrolled"), value: String(totalEnrolled),          icon: BookOpen,    color: "text-primary",      bg: "bg-primary/10"      },
          { label: t("dashboard.completed"),       value: String(totalCompleted),         icon: CheckCircle, color: "text-green-400",    bg: "bg-green-400/10"    },
          { label: t("dashboard.points"),          value: String(userPoints?.total ?? 0), icon: Trophy,      color: "text-yellow-400",   bg: "bg-yellow-400/10"   },
          { label: "Certificados",                  value: String(certificates),           icon: Award,       color: "text-orange-400",   bg: "bg-orange-400/10"   },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="transition-colors hover:border-border/80">
              <CardContent className="flex items-center gap-3 pt-5 pb-5">
                <div className={`p-2.5 rounded-xl ${stat.bg} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black text-foreground leading-none">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cursos en progreso + Próximas clases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Cursos en progreso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                {t("dashboard.continuelearning")}
              </span>
              <Link href="/dashboard/courses" className="text-xs text-primary/70 hover:text-primary transition-colors font-normal">
                Ver todos →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inProgressCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Star className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {totalEnrolled === 0 ? t("dashboard.noEnrollments") : "¡Todos los cursos completados! 🎉"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {inProgressCourses.map(({ enrollment: e, total, done }) => {
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <Link key={e.courseId} href={`/dashboard/courses/${e.courseId}`}>
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 hover:bg-muted/60 transition-all space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{e.course.title}</p>
                          <span className="text-xs font-bold text-primary flex-shrink-0">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-[11px] text-muted-foreground">{done} de {total} lecciones completadas</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas clases en directo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
                {t("dashboard.upcomingClasses")}
              </span>
              <Link href="/dashboard/live" className="text-xs text-primary/70 hover:text-primary transition-colors font-normal">
                Ver todas →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Video className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noClasses")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cls.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(cls.scheduledAt, "d MMM · HH:mm", { locale: es })}
                        {cls.instructor?.name && ` · ${cls.instructor.name}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 bg-purple-500/10 flex-shrink-0">
                      {cls.durationMins}min
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Progreso global */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Mi progreso global
            </CardTitle>
            <span className="text-xs text-muted-foreground">{totalDone} / {totalLessons} lecciones</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={globalProgress} className="h-2.5" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {globalProgress === 0
                ? "Empieza una lección para ver tu progreso"
                : globalProgress === 100
                ? "🎉 ¡Formación completada al 100%!"
                : `${globalProgress}% completado`}
            </p>
            {streak > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                Racha de {streak} {streak === 1 ? "día" : "días"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
