import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

// POST — deep-clone a marketplace course into the caller's org
export async function POST(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { courseId } = await params;

  // Load full marketplace course
  const source = await prisma.course.findUnique({
    where: { id: courseId, isMarketplace: true, status: "PUBLISHED" },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              quiz: {
                include: {
                  questions: { include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!source) return NextResponse.json({ error: "Curso no encontrado en marketplace" }, { status: 404 });

  // Check not already imported
  const existing = await prisma.course.findFirst({
    where: { organizationId: user.organizationId, importedFromId: courseId },
  });
  if (existing) return NextResponse.json({ error: "Ya tienes este curso importado", courseId: existing.id }, { status: 409 });

  // Deep clone
  const cloned = await prisma.course.create({
    data: {
      title:              source.title,
      description:        source.description,
      thumbnailUrl:       source.thumbnailUrl,
      status:             "DRAFT",
      isRequired:         source.isRequired,
      daysToComplete:     source.daysToComplete,
      certificateEnabled: source.certificateEnabled,
      certificateType:    source.certificateType,
      certificateValidityDays: source.certificateValidityDays,
      certSignerName:     source.certSignerName,
      certSignerTitle:    source.certSignerTitle,
      organizationId:     user.organizationId,
      importedFromId:     courseId,
    },
  });

  for (const mod of source.modules) {
    const clonedMod = await prisma.module.create({
      data: { title: mod.title, description: mod.description, order: mod.order, courseId: cloned.id },
    });

    for (const lesson of mod.lessons) {
      const clonedLesson = await prisma.lesson.create({
        data: {
          title:       lesson.title,
          description: lesson.description,
          type:        lesson.type,
          videoUrl:    lesson.videoUrl,
          fileUrl:     lesson.fileUrl,
          duration:    lesson.duration,
          order:       lesson.order,
          isRequired:  lesson.isRequired,
          content:     lesson.content ?? undefined,
          moduleId:    clonedMod.id,
        },
      });

      // Clone quiz if present
      if (lesson.quiz) {
        const clonedQuiz = await prisma.quiz.create({
          data: {
            lessonId:     clonedLesson.id,
            passingScore: lesson.quiz.passingScore,
            maxAttempts:  lesson.quiz.maxAttempts,
            timeLimitMins: lesson.quiz.timeLimitMins,
          },
        });
        for (const q of lesson.quiz.questions) {
          const clonedQ = await prisma.quizQuestion.create({
            data: {
              quizId:      clonedQuiz.id,
              text:        q.text,
              type:        q.type,
              imageUrl:    q.imageUrl,
              modelAnswer: q.modelAnswer,
              explanation: q.explanation,
              order:       q.order,
            },
          });
          for (const opt of q.options) {
            await prisma.quizOption.create({
              data: { questionId: clonedQ.id, text: opt.text, isCorrect: opt.isCorrect, order: opt.order },
            });
          }
        }
      }
    }
  }

  await createAuditLog({
    action:         "COURSE_CREATED",
    userId:         user.id,
    organizationId: user.organizationId,
    entity:         "Course",
    entityId:       cloned.id,
    metadata:       { importedFrom: courseId, title: cloned.title },
  });

  return NextResponse.json({ ok: true, courseId: cloned.id, title: cloned.title }, { status: 201 });
}
