import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, TrendingUp, Star, BookOpen, Video, HelpCircle, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { VideoHeatmap } from "@/components/admin/video-heatmap";
import { LessonFunnelChart } from "@/components/admin/lesson-funnel-chart";

export const metadata = { title: "Analytics del curso" };

export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string; organizationId?: string };
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user?.role ?? "")) {
    redirect("/dashboard");
  }

  const { id: courseId } = await params;

  const course = await prisma.course.findUnique({
    where:   { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select:  { id: true, title: true, type: true, duration: true, order: true },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course || course.organizationId !== user.organizationId) notFound();

  const totalEnrolled = course._count.enrollments;
  const allLessons = course.modules.flatMap(m =>
    m.lessons.map(l => ({ ...l, moduleTitle: m.title }))
  );
  const lessonIds = allLessons.map(l => l.id);

  if (lessonIds.length === 0) {
    return (
      <div className="space-y-6">
        <BackHeader courseId={courseId} title={course.title} enrolled={totalEnrolled} />
        <Card><CardContent className="py-16 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Este curso no tiene lecciones todavía</p>
        </CardContent></Card>
      </div>
    );
  }

  // ── Completados por lección ─────────────────────────────────────────────────
  const progressRows = await prisma.lessonProgress.groupBy({
    by:    ["lessonId"],
    where: { lessonId: { in: lessonIds }, completed: true },
    _count: { _all: true },
  });
  const completedMap = Object.fromEntries(progressRows.map(r => [r.lessonId, r._count._all]));

  // ── Tiempo medio por lección (vídeos) ──────────────────────────────────────
  const watchRows = lessonIds.length > 0
    ? await prisma.$queryRaw<{ lesson_id: string; avg_time: number | null }[]>`
        SELECT lesson_id, AVG(total_watch_time)::FLOAT AS avg_time
        FROM   video_watch_sessions
        WHERE  lesson_id IN (${Prisma.join(lessonIds)})
        GROUP BY lesson_id
      `
    : [];
  const watchMap = Object.fromEntries(watchRows.map(r => [r.lesson_id, r.avg_time]));

  // ── Scores de quizzes por lección ──────────────────────────────────────────
  const quizRows = lessonIds.length > 0
    ? await prisma.$queryRaw<{ lesson_id: string; avg_score: number | null; pass_rate: number | null }[]>`
        SELECT l.id AS lesson_id,
               AVG(qa.score)::FLOAT          AS avg_score,
               AVG(CASE WHEN qa.passed THEN 100.0 ELSE 0.0 END)::FLOAT AS pass_rate
        FROM   lessons l
        JOIN   quizzes q   ON q.lesson_id = l.id
        JOIN   quiz_attempts qa ON qa.quiz_id = q.id
        WHERE  l.id IN (${Prisma.join(lessonIds)})
        GROUP BY l.id
      `
    : [];
  const quizMap = Object.fromEntries(quizRows.map(r => [r.lesson_id, { avg: r.avg_score, passRate: r.pass_rate }]));

  // ── Media de valoraciones del curso ───────────────────────────────────────
  const ratingRow = await prisma.$queryRaw<{ avg: number | null; count: bigint }[]>`
    SELECT AVG(rating)::FLOAT AS avg, COUNT(*) FILTER (WHERE rating IS NOT NULL) AS count
    FROM   enrollments WHERE course_id = ${courseId}
  `;
  const avgRating   = ratingRow[0]?.avg ? Math.round(ratingRow[0].avg * 10) / 10 : null;
  const ratingCount = Number(ratingRow[0]?.count ?? 0);

  // ── Completados totales del curso (alumnos que terminaron TODO) ───────────
  const completedEnrollments = await prisma.enrollment.count({
    where: { courseId, status: "COMPLETED" },
  });

  // ── Construir datos de cada lección ───────────────────────────────────────
  const lessonStats = allLessons.map((l, idx) => {
    const completed  = completedMap[l.id] ?? 0;
    const compRate   = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0;
    const prevRate   = idx > 0
      ? (totalEnrolled > 0 ? Math.round(((completedMap[allLessons[idx - 1].id] ?? 0) / totalEnrolled) * 100) : 0)
      : 100;
    const dropout    = Math.max(0, prevRate - compRate);
    const avgWatch   = watchMap[l.id] ? Math.round((watchMap[l.id]! / 60) * 10) / 10 : null;
    const quiz       = quizMap[l.id] ?? null;

    return {
      id:           l.id,
      title:        l.title,
      type:         l.type,
      moduleTitle:  l.moduleTitle,
      order:        idx + 1,
      completed,
      compRate,
      dropout,
      avgWatchMin:  avgWatch,
      quizAvg:      quiz?.avg    ? Math.round(quiz.avg)    : null,
      quizPassRate: quiz?.passRate ? Math.round(quiz.passRate) : null,
    };
  });

  // ── KPIs globales ─────────────────────────────────────────────────────────
  const overallCompRate = totalEnrolled > 0 ? Math.round((completedEnrollments / totalEnrolled) * 100) : 0;
  const worstDropout    = [...lessonStats].sort((a, b) => b.dropout - a.dropout)[0];
  const avgCompRate     = lessonStats.length > 0
    ? Math.round(lessonStats.reduce((s, l) => s + l.compRate, 0) / lessonStats.length)
    : 0;

  const videoLessons = allLessons.filter(l => l.type === "VIDEO");

  return (
    <div className="space-y-8">
      <BackHeader courseId={courseId} title={course.title} enrolled={totalEnrolled} />

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,     label: "Alumnos inscritos", value: totalEnrolled,          color: "text-blue-500",   bg: "bg-blue-500/10"   },
          { icon: TrendingUp,label: "Tasa de finalización", value: `${overallCompRate}%`, color: overallCompRate >= 70 ? "text-green-500" : overallCompRate >= 40 ? "text-amber-500" : "text-red-500", bg: "bg-muted" },
          { icon: Star,      label: "Valoración media",  value: avgRating ? `${avgRating} ⭐` : "—", color: "text-yellow-500", bg: "bg-yellow-500/10" },
          { icon: AlertTriangle, label: "Mayor abandono", value: worstDropout?.dropout ? `−${worstDropout.dropout}%` : "—", color: "text-red-500", bg: "bg-red-500/10" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-black leading-none ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Funnel visual ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Funnel de engagement por lección
            <Badge variant="outline" className="text-[10px] ml-auto font-normal">
              % de inscritos que completaron
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LessonFunnelChart lessons={lessonStats} totalEnrolled={totalEnrolled} />
        </CardContent>
      </Card>

      {/* ── Tabla de lecciones ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Detalle por lección</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Lección</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Completados</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Tasa</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Abandono</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Tiempo medio</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Quiz avg</th>
                </tr>
              </thead>
              <tbody>
                {lessonStats.map((l, i) => (
                  <tr key={l.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"} hover:bg-muted/40 transition-colors`}>
                    <td className="px-4 py-3 text-muted-foreground font-mono">{l.order}</td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-foreground truncate">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{l.moduleTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={l.type} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {l.completed}<span className="text-muted-foreground font-normal">/{totalEnrolled}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${l.compRate >= 70 ? "text-green-500" : l.compRate >= 40 ? "text-amber-500" : "text-red-500"}`}>
                        {l.compRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.dropout > 0 ? (
                        <span className={`font-semibold ${l.dropout >= 20 ? "text-red-500" : l.dropout >= 10 ? "text-amber-500" : "text-muted-foreground"}`}>
                          −{l.dropout}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {l.avgWatchMin != null ? `${l.avgWatchMin} min` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.quizAvg != null ? (
                        <span className={`font-semibold ${l.quizAvg >= 70 ? "text-green-500" : l.quizAvg >= 50 ? "text-amber-500" : "text-red-500"}`}>
                          {l.quizAvg}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Heatmaps de vídeo (existentes) ── */}
      {videoLessons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              Heatmap de reproducción por vídeo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {videoLessons.map((lesson, idx) => (
              <div key={lesson.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">Lección {idx + 1}</Badge>
                  <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                </div>
                <VideoHeatmap
                  lessonId={lesson.id}
                  duration={lesson.duration ? lesson.duration * 60 : undefined}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BackHeader({ courseId, title, enrolled }: { courseId: string; title: string; enrolled: number }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/admin/courses/${courseId}/edit`} className="text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <div>
        <h1 className="text-xl font-black text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Analytics de engagement · {enrolled} alumnos inscritos</p>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    VIDEO:      { label: "Vídeo",     icon: <Video      className="w-3 h-3" />, className: "border-blue-300   text-blue-600   bg-blue-50"   },
    PDF:        { label: "PDF",       icon: <FileText   className="w-3 h-3" />, className: "border-orange-300 text-orange-600 bg-orange-50" },
    QUIZ:       { label: "Quiz",      icon: <HelpCircle className="w-3 h-3" />, className: "border-purple-300 text-purple-600 bg-purple-50" },
    CONTENT:    { label: "Contenido", icon: <BookOpen   className="w-3 h-3" />, className: "border-green-300  text-green-600  bg-green-50"  },
    LIVE_CLASS: { label: "Directo",   icon: <Users      className="w-3 h-3" />, className: "border-red-300    text-red-600    bg-red-50"    },
  };
  const cfg = map[type] ?? { label: type, icon: null, className: "border-border text-muted-foreground" };
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 flex items-center w-fit ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
}
