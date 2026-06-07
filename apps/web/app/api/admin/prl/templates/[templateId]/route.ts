import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PRL_TEMPLATES } from "@/lib/prl-templates";

export async function POST(_req: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { templateId } = await params;
  const template = PRL_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }

  // Si ya existe un curso con este título PRL en la org, devuelve el existente
  const existing = await prisma.course.findFirst({
    where: { organizationId: user.organizationId, title: template.title, isPrl: true },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ courseId: existing.id, alreadyExists: true });
  }

  // Crear el curso completo en una transacción
  const course = await prisma.$transaction(async (tx) => {
    const newCourse = await tx.course.create({
      data: {
        organizationId: user.organizationId,
        title: template.title,
        description: template.description,
        status: "DRAFT",
        isRequired: true,
        isPrl: true,
        prlRiskLevel: template.prlRiskLevel,
        certificateEnabled: true,
        certificateType: "PROFESSIONAL",
        certificateValidityDays: template.certificateValidityDays,
        order: 0,
      },
    });

    for (let mi = 0; mi < template.modules.length; mi++) {
      const tMod = template.modules[mi];
      const mod = await tx.module.create({
        data: {
          courseId: newCourse.id,
          title: tMod.title,
          description: tMod.description,
          order: mi,
        },
      });

      for (let li = 0; li < tMod.lessons.length; li++) {
        const tLesson = tMod.lessons[li];
        const lesson = await tx.lesson.create({
          data: {
            moduleId: mod.id,
            title: tLesson.title,
            description: tLesson.description,
            type: tLesson.type === "PDF" ? "PDF" : "QUIZ",
            order: li,
            isRequired: true,
          },
        });

        if (tLesson.type === "QUIZ" && tLesson.quiz) {
          const quiz = await tx.quiz.create({
            data: {
              lessonId: lesson.id,
              passingScore: tLesson.quiz.passingScore,
              maxAttempts: tLesson.quiz.maxAttempts,
            },
          });

          for (let qi = 0; qi < tLesson.quiz.questions.length; qi++) {
            const tQ = tLesson.quiz.questions[qi];
            const question = await tx.quizQuestion.create({
              data: {
                quizId: quiz.id,
                text: tQ.text,
                type: tQ.type,
                explanation: tQ.explanation,
                order: qi,
              },
            });

            for (let oi = 0; oi < tQ.options.length; oi++) {
              await tx.quizOption.create({
                data: {
                  questionId: question.id,
                  text: tQ.options[oi].text,
                  isCorrect: tQ.options[oi].isCorrect,
                  order: oi,
                },
              });
            }
          }
        }
      }
    }

    return newCourse;
  });

  return NextResponse.json({ courseId: course.id });
}
