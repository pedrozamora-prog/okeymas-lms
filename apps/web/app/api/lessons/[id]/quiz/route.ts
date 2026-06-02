import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { dispatchWebhook } from "@/lib/webhooks";

// GET — obtener quiz sin revelar respuestas correctas
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where:   { lessonId },
    include: {
      questions: {
        include:  { options: { select: { id: true, text: true, order: true }, orderBy: { order: "asc" } } },
        orderBy:  { order: "asc" },
      },
    },
  });

  if (!quiz) return NextResponse.json(null);

  // Contar intentos del usuario
  const attemptsUsed = await prisma.quizAttempt.count({
    where: { quizId: quiz.id, userId: user.id },
  });

  // Último intento
  const lastAttempt = await prisma.quizAttempt.findFirst({
    where:   { quizId: quiz.id, userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ...quiz,
    attemptsUsed,
    attemptsLeft: Math.max(0, quiz.maxAttempts - attemptsUsed),
    lastAttempt: lastAttempt
      ? { score: lastAttempt.score, passed: lastAttempt.passed, createdAt: lastAttempt.createdAt }
      : null,
  });
}

// POST — enviar intento
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; organizationId?: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;
  const { answers } = await req.json() as { answers: { questionId: string; selectedOptionId: string }[] };

  const quiz = await prisma.quiz.findUnique({
    where:   { lessonId },
    include: {
      questions: { include: { options: { where: { isCorrect: true }, select: { id: true, questionId: true } } } },
    },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz no encontrado" }, { status: 404 });

  // Verificar intentos restantes
  const attemptsUsed = await prisma.quizAttempt.count({
    where: { quizId: quiz.id, userId: user.id },
  });
  if (attemptsUsed >= quiz.maxAttempts) {
    return NextResponse.json({ error: "Has agotado todos los intentos permitidos" }, { status: 403 });
  }

  // Calcular puntuación
  const correctMap = new Map(
    quiz.questions.map(q => [q.id, q.options[0]?.id ?? ""])
  );
  let correct = 0;
  for (const answer of answers) {
    if (correctMap.get(answer.questionId) === answer.selectedOptionId) correct++;
  }
  const score  = quiz.questions.length > 0 ? Math.round((correct / quiz.questions.length) * 100) : 0;
  const passed = score >= quiz.passingScore;

  // Guardar intento
  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizId: quiz.id,
      score,
      passed,
      answers,
    },
  });

  // Si pasó → marcar lección como completada
  let certificateIssued = false;
  if (passed) {
    await prisma.lessonProgress.upsert({
      where:  { userId_lessonId: { userId: user.id, lessonId } },
      create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });

    // Puntos por aprobar quiz
    await prisma.userPoints.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, total: 20 },
      update: { total: { increment: 20 } },
    });

    // Comprobar si el curso está completo
    const lesson = await prisma.lesson.findUnique({
      where:   { id: lessonId },
      include: { module: { include: { course: { include: { modules: { include: { lessons: { select: { id: true } } } } } } } } },
    });
    const course = lesson?.module?.course;
    if (course?.certificateEnabled) {
      const allIds    = course.modules.flatMap(m => m.lessons.map(l => l.id));
      const doneCount = await prisma.lessonProgress.count({
        where: { userId: user.id, lessonId: { in: allIds }, completed: true },
      });
      if (doneCount >= allIds.length) {
        const existing = await prisma.certificate.findFirst({ where: { userId: user.id, courseId: course.id } });
        if (!existing) {
          const expiresAt = course.certificateValidityDays
            ? new Date(Date.now() + course.certificateValidityDays * 86400000)
            : null;
          await prisma.certificate.create({
            data: { userId: user.id, courseId: course.id, courseTitle: course.title, type: course.certificateType, expiresAt },
          });
          certificateIssued = true;
          if (user.organizationId) {
            await dispatchWebhook(user.organizationId, "CERTIFICATE_ISSUED", { userId: user.id, courseId: course.id });
          }
        }
      }
    }
  }

  // Resultado con respuestas correctas (ahora sí las revelamos)
  const correctAnswers = Object.fromEntries(correctMap);

  return NextResponse.json({ score, passed, correct, total: quiz.questions.length, correctAnswers, certificateIssued });
}
