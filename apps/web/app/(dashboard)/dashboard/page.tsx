import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Clock, Trophy, Video, Award, Users, TrendingUp, BarChart3, GraduationCap } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user as { id: string; name?: string | null; role?: string; organizationId?: string };
  const firstName = user?.name?.split(" ")[0] ?? "Campeón";
  const isAdmin      = ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user?.role ?? "");
  const isInstructor = user?.role === "INSTRUCTOR";

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
      { label: "Usuarios activos",     value: String(totalUsers),        icon: Users,       color: "text-yelau-yellow", bg: "bg-yelau-yellow/10" },
      { label: "Cursos publicados",    value: String(totalCourses),       icon: BookOpen,    color: "text-blue-400",     bg: "bg-blue-500/10"     },
      { label: "Inscripciones totales",value: String(totalEnrollments),   icon: GraduationCap, color: "text-purple-400", bg: "bg-purple-500/10"  },
      { label: "Cursos completados",   value: String(completedEnrollments),icon: CheckCircle, color: "text-green-400",   bg: "bg-green-500/10"    },
      { label: "Certificados emitidos",value: String(totalCertificates),  icon: Award,       color: "text-orange-400",   bg: "bg-orange-500/10"   },
      { label: "Tasa de finalización", value: `${completionRate}%`,       icon: TrendingUp,  color: "text-yelau-yellow", bg: "bg-yelau-yellow/10" },
    ];

    return (
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-black text-foreground tracking-tight" style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}>
            Panel de control 📊
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Resumen general de tu organización
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
                <BarChart3 className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                Cursos más populares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay cursos publicados</p>
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
                        {course._count.enrollments} inscritos
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
                <TrendingUp className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                Inscripciones recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin actividad reciente</p>
              ) : recentEnrollments.map((e) => (
                <div key={`${e.userId}-${e.courseId}`} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-yelau-yellow flex items-center justify-center flex-shrink-0">
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

        {/* Próximas clases */}
        {upcomingClasses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Video className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                Próximas clases en directo
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
            ¡Hola, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Aquí tienes el estado de tus cursos y alumnos.
          </p>
        </div>

        {/* Stats instructor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Cursos activos",    value: String(myCourses.length),  icon: BookOpen, color: "text-yelau-yellow", bg: "bg-yelau-yellow/10" },
            { label: "Alumnos únicos",    value: String(totalAlumnos),      icon: Users,    color: "text-blue-400",     bg: "bg-blue-500/10"     },
            { label: "Total inscritos",   value: String(totalInscritos),    icon: GraduationCap, color: "text-purple-400", bg: "bg-purple-500/10" },
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
                <BookOpen className="w-4 h-4 text-yelau-yellow" />
                Mis cursos
              </span>
              <Link href="/admin/courses" className="text-xs text-yelau-yellow hover:underline font-normal">
                Gestionar →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay cursos publicados aún</p>
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
                      <span className="text-xs text-muted-foreground">{course._count.enrollments} alumnos</span>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        <Badge variant="outline" className="text-[10px] hover:border-yelau-yellow/40 cursor-pointer transition-colors">Editar</Badge>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={avgProgress} className="h-1.5 flex-1" />
                    <span className="text-xs text-yelau-yellow font-bold w-10 text-right">{avgProgress}%</span>
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
              <Video className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
              Mis próximas clases en directo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Video className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No tienes clases programadas próximamente</p>
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
  const [enrollments, userPoints, certificates, upcomingClasses] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: { modules: { include: { lessons: { select: { id: true } } } } },
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
  const totalInProgress = courseStats.filter(c => c.done > 0 && c.done < c.total).length;
  const totalLessons    = courseStats.reduce((s, c) => s + c.total, 0);
  const totalDone       = courseStats.reduce((s, c) => s + c.done, 0);
  const globalProgress  = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;
  const inProgressCourses = courseStats.filter(c => c.done > 0 && c.done < c.total).slice(0, 3);

  const stats = [
    { label: "Cursos inscritos",  value: String(totalEnrolled),          icon: BookOpen,    color: "text-yelau-yellow", bg: "bg-yelau-yellow/10" },
    { label: "Completados",        value: String(totalCompleted),         icon: CheckCircle, color: "text-green-400",    bg: "bg-green-400/10"    },
    { label: "En progreso",        value: String(totalInProgress),        icon: Clock,       color: "text-blue-400",     bg: "bg-blue-400/10"     },
    { label: "Puntos acumulados",  value: String(userPoints?.total ?? 0), icon: Trophy,      color: "text-yelau-yellow", bg: "bg-yelau-yellow/10" },
    { label: "Clases en directo",  value: String(upcomingClasses.length), icon: Video,       color: "text-purple-400",   bg: "bg-purple-400/10"   },
    { label: "Certificados",       value: String(certificates),           icon: Award,       color: "text-orange-400",   bg: "bg-orange-400/10"   },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="font-black text-foreground tracking-tight" style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)" }}>
          ¡Hola, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Bienvenido a Okeymas LMS. Aquí tienes tu resumen de hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="@container">
              <Card className="transition-colors hover:border-border/80">
                <CardContent className="flex items-center gap-4 pt-6 pb-6">
                  <div className={`p-3 rounded-xl ${stat.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-black text-foreground leading-none">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Video className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
              Próximas clases en directo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Video className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No hay clases programadas próximamente</p>
                <Link href="/dashboard/live">
                  <Badge variant="outline" className="text-xs mt-1 cursor-pointer hover:border-yelau-yellow/40 transition-colors">Ver todas</Badge>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
              Continuar aprendiendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inProgressCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {totalEnrolled === 0 ? "Aún no tienes cursos inscritos" : "¡Empieza uno de tus cursos!"}
                </p>
                <Link href="/dashboard/courses">
                  <Badge variant="outline" className="text-xs mt-1 cursor-pointer hover:border-yelau-yellow/40 transition-colors">Explorar cursos</Badge>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressCourses.map(({ enrollment: e, total, done }) => {
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <Link key={e.courseId} href={`/dashboard/courses/${e.courseId}`}>
                      <div className="p-3 rounded-lg bg-muted/40 border border-border/50 hover:border-yelau-yellow/30 transition-colors space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{e.course.title}</p>
                          <span className="text-xs text-yelau-yellow font-bold flex-shrink-0">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-[11px] text-muted-foreground">{done} de {total} lecciones</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Mi progreso global</CardTitle>
            <span className="text-xs text-muted-foreground">{totalDone} / {totalLessons} lecciones</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={globalProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {globalProgress === 0
              ? "Inscríbete en un curso para empezar a ver tu progreso"
              : globalProgress === 100
              ? "🎉 ¡Has completado todos tus cursos!"
              : `Llevas un ${globalProgress}% del total de tus cursos`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
