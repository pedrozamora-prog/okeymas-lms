import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StreamPlayer } from "@/components/lesson/stream-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, FileText, HelpCircle, Radio } from "lucide-react";
import { LessonCompleteButton } from "@/components/lesson/lesson-complete-button";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id: string };
  const { id: courseId, lessonId } = await params;

  // Verificar inscripción
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) redirect(`/dashboard/courses/${courseId}`);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });
  if (!lesson || lesson.module.courseId !== courseId) notFound();

  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  // Lecciones del módulo para navegación
  const moduleLessons = await prisma.lesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true },
  });
  const currentIdx = moduleLessons.findIndex(l => l.id === lessonId);
  const prevLesson = moduleLessons[currentIdx - 1];
  const nextLesson = moduleLessons[currentIdx + 1];

  const typeIcon: Record<string, React.ReactNode> = {
    VIDEO:      null,
    PDF:        <FileText className="w-4 h-4" />,
    QUIZ:       <HelpCircle className="w-4 h-4" />,
    LIVE_CLASS: <Radio className="w-4 h-4" />,
    SCORM:      null,
  };
  const typeLabel: Record<string, string> = {
    VIDEO: "Vídeo", PDF: "PDF", QUIZ: "Quiz", LIVE_CLASS: "Directo", SCORM: "SCORM",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/dashboard/courses/${courseId}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          {lesson.module.course.title}
        </Link>
        <span>/</span>
        <span>{lesson.module.title}</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-black text-foreground">{lesson.title}</h1>
          {progress?.completed && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completada
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {typeIcon[lesson.type]}
            {typeLabel[lesson.type]}
          </span>
          {lesson.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.duration} min
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {lesson.type === "VIDEO" && lesson.videoUrl && (
        <StreamPlayer uid={lesson.videoUrl} title={lesson.title} />
      )}

      {lesson.type === "PDF" && lesson.fileUrl && (
        <div className="rounded-lg border border-border overflow-hidden">
          <iframe
            src={lesson.fileUrl}
            className="w-full h-[600px]"
            title={lesson.title}
          />
        </div>
      )}

      {lesson.type === "QUIZ" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border rounded-lg">
          <HelpCircle className="w-10 h-10 text-yelau-yellow/60" />
          <p className="text-foreground font-semibold">Quiz interactivo</p>
          <p className="text-sm text-muted-foreground">Próximamente disponible</p>
        </div>
      )}

      {lesson.type === "LIVE_CLASS" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border rounded-lg">
          <Radio className="w-10 h-10 text-red-400/60" />
          <p className="text-foreground font-semibold">Clase en directo</p>
          <p className="text-sm text-muted-foreground">Accede desde la sección "Clases en directo"</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/live">Ver clases programadas</Link>
          </Button>
        </div>
      )}

      {lesson.description && (
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-sm text-muted-foreground leading-relaxed">{lesson.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {prevLesson && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/courses/${courseId}/lessons/${prevLesson.id}`}>
                <ArrowLeft className="w-3.5 h-3.5" />
                Anterior
              </Link>
            </Button>
          )}
        </div>

        <LessonCompleteButton
          lessonId={lessonId}
          courseId={courseId}
          isCompleted={progress?.completed ?? false}
          nextLessonId={nextLesson?.id}
        />
      </div>
    </div>
  );
}
