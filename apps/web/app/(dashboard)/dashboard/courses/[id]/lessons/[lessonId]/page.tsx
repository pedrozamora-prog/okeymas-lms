import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { VideoLessonClient } from "@/components/lesson/video-lesson-client";
import { QuizPlayer } from "@/components/lesson/quiz-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, FileText, HelpCircle, Radio, Volume2 } from "lucide-react";
import { LessonCompleteButton } from "@/components/lesson/lesson-complete-button";
import { LessonComments } from "@/components/lessons/lesson-comments";
import { BlockRenderer } from "@/components/lesson/block-renderer";
import { Block } from "@/lib/blocks";
import { LessonContextSetter } from "@/components/lesson/lesson-context-setter";

function extractContentText(blocks: unknown[]): string {
  return (blocks as Array<Record<string, unknown>>)
    .map(b => {
      if (b.type === "heading")   return `## ${b.text ?? ""}`;
      if (b.type === "paragraph") return String(b.text ?? "");
      if (b.type === "callout")   return `[${String(b.variant ?? "nota").toUpperCase()}]: ${b.text ?? ""}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000); // cap to avoid token overflow
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string };
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

  // Fetch audioNarrationUrl via raw SQL (column added after client generation)
  const audioRow = await prisma.$queryRaw<{ audio_narration_url: string | null }[]>`
    SELECT audio_narration_url FROM lessons WHERE id = ${lessonId}
  `;
  const audioNarrationUrl = audioRow[0]?.audio_narration_url ?? null;

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
    CONTENT:    <FileText className="w-4 h-4" />,
  };
  const typeLabel: Record<string, string> = {
    VIDEO: "Vídeo", PDF: "PDF", QUIZ: "Quiz", LIVE_CLASS: "Directo", SCORM: "SCORM", CONTENT: "Contenido",
  };

  const contentText = lesson.type === "CONTENT" && lesson.content
    ? extractContentText(lesson.content as unknown[])
    : lesson.description ?? "";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Inject lesson context into AI tutor */}
      <LessonContextSetter ctx={{
        courseTitle:  lesson.module.course.title,
        moduleTitle:  lesson.module.title,
        lessonTitle:  lesson.title,
        lessonType:   lesson.type,
        contentText,
      }} />

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

      {/* Audio narration player */}
      {audioNarrationUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Volume2 className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary mb-1.5">Narración de audio</p>
            <audio controls src={audioNarrationUrl} className="w-full h-8 accent-primary" />
          </div>
        </div>
      )}

      {/* Content */}
      {lesson.type === "VIDEO" && lesson.videoUrl && (
        <VideoLessonClient
          videoUrl={lesson.videoUrl}
          title={lesson.title}
          lessonId={lessonId}
          courseId={courseId}
          isCompleted={progress?.completed ?? false}
          nextLessonId={nextLesson?.id}
        />
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
        <QuizPlayer
          lessonId={lessonId}
          courseId={courseId}
          nextLessonId={nextLesson?.id}
        />
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

      {lesson.type === "CONTENT" && lesson.content && (
        <BlockRenderer blocks={lesson.content as Block[]} />
      )}

      {lesson.type !== "CONTENT" && lesson.description && (
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-sm text-muted-foreground leading-relaxed">{lesson.description}</p>
        </div>
      )}

      {/* Foro de la lección */}
      <div className="pt-6 border-t border-border">
        <LessonComments
          lessonId={lessonId}
          currentUserId={user.id}
          currentUserRole={user.role ?? "EMPLOYEE"}
        />
      </div>

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
          courseTitle={lesson.module.course.title}
          isCompleted={progress?.completed ?? false}
          nextLessonId={nextLesson?.id}
        />
      </div>
    </div>
  );
}
