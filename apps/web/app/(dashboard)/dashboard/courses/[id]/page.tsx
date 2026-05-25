import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LessonList } from "@/components/courses/lesson-list";
import { EnrollButton } from "@/components/courses/enroll-button";
import { BookOpen, Clock, Users, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id: string };

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { quiz: true, liveClass: true },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: id } },
  });

  const allLessons = course.modules.flatMap(m => m.lessons);
  const completedLessons = enrollment
    ? await prisma.lessonProgress.count({
        where: { userId: user.id, lessonId: { in: allLessons.map(l => l.id) }, completed: true },
      })
    : 0;

  const progress = allLessons.length > 0
    ? Math.round((completedLessons / allLessons.length) * 100)
    : 0;

  const totalMins = allLessons.reduce((acc, l) => acc + (l.duration ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/dashboard/courses" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a cursos
      </Link>

      {/* Hero */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-yelau-yellow/20 via-muted to-muted flex items-center justify-center">
          <BookOpen className="w-16 h-16 text-yelau-yellow/40" />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <h1 className="text-xl font-black text-foreground flex-1">{course.title}</h1>
            {course.isRequired && (
              <Badge className="bg-yelau-yellow text-yelau-black font-bold flex-shrink-0">Obligatorio</Badge>
            )}
          </div>

          {course.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{course.description}</p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {allLessons.length} lecciones
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {Math.round(totalMins / 60)}h {totalMins % 60}min
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {course._count.enrollments} inscritos
            </span>
          </div>

          <Separator />

          {/* Progreso o botón inscripción */}
          {enrollment ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  {completedLessons} de {allLessons.length} lecciones completadas
                </span>
                <span className="font-bold text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <EnrollButton courseId={id} />
          )}
        </div>
      </div>

      {/* Módulos y lecciones */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Contenido del curso</h2>
        <LessonList
          modules={course.modules}
          userId={user.id}
          enrolled={!!enrollment}
        />
      </div>
    </div>
  );
}
