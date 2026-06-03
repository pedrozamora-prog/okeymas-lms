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
        select: {
          id: true, text: true, type: true, imageUrl: true, explanation: true, order: true,
          options: { select: { id: true, text: true, order: true }, orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
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

type AnswerInput =
  | { questionId: string; selectedOptionId: string }
  | { questionId: string; orderedIds: string[] }
  | { questionId: string; filledAnswers: string[] }
  | { questionId: string; freeText: string };

// POST — enviar intento
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; organizationId?: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;
  const { answers } = await req.json() as { answers: AnswerInput[] };

  const quiz = await prisma.quiz.findUnique({
    where:   { lessonId },
    include: {
      questions: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy:  { order: "asc" },
      },
    },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz no encontrado" }, { status: 404 });

  const attemptsUsed = await prisma.quizAttempt.count({ where: { quizId: quiz.id, userId: user.id } });
  if (attemptsUsed >= quiz.maxAttempts) {
    return NextResponse.json({ error: "Has agotado todos los intentos permitidos" }, { status: 403 });
  }

  // ── Grading per question type ─────────────────────────────────────────────
  const correctAnswers: Record<string, unknown> = {};
  const perQuestionScore: Record<string, number> = {};

  for (const q of quiz.questions) {
    const answer = answers.find(a => a.questionId === q.id);
    const opts   = q.options;

    if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" || q.type === "IMAGE_CHOICE") {
      const correctOpt = opts.find(o => o.isCorrect);
      correctAnswers[q.id] = correctOpt?.id ?? "";
      const sel = (answer as { selectedOptionId?: string })?.selectedOptionId;
      perQuestionScore[q.id] = sel && sel === correctOpt?.id ? 1 : 0;

    } else if (q.type === "ORDER_ITEMS") {
      const orderedIds = (answer as { orderedIds?: string[] })?.orderedIds ?? [];
      const correctOrder = opts.map(o => o.id); // options stored in correct order
      correctAnswers[q.id] = correctOrder;
      const allCorrect = correctOrder.every((id, i) => orderedIds[i] === id);
      perQuestionScore[q.id] = allCorrect ? 1 : 0;

    } else if (q.type === "FILL_BLANK") {
      const filled  = (answer as { filledAnswers?: string[] })?.filledAnswers ?? [];
      const correct = opts.map(o => o.text.toLowerCase().trim());
      correctAnswers[q.id] = opts.map(o => o.text);
      const allMatch = correct.every((c, i) => (filled[i] ?? "").toLowerCase().trim() === c);
      perQuestionScore[q.id] = allMatch ? 1 : 0;

    } else if (q.type === "FREE_TEXT") {
      const freeText   = (answer as { freeText?: string })?.freeText ?? "";
      const modelAns   = q.modelAnswer ?? "";
      correctAnswers[q.id] = modelAns;
      let aiScore = 0;
      if (freeText && modelAns) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:  "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({
              model: "llama3-8b-8192",
              messages: [{
                role: "user",
                content: `Evalúa esta respuesta de quiz del 0 al 10. Responde SOLO con un número entero entre 0 y 10, sin explicación.\n\nRespuesta modelo: ${modelAns}\nRespuesta del alumno: ${freeText}`,
              }],
              max_tokens: 5,
              temperature: 0,
            }),
          });
          const data = await res.json();
          const raw  = data.choices?.[0]?.message?.content?.trim() ?? "0";
          aiScore    = Math.min(10, Math.max(0, parseInt(raw) || 0));
        } catch { aiScore = 0; }
      }
      perQuestionScore[q.id] = aiScore / 10;
    }
  }

  const totalQuestions = quiz.questions.length;
  const correct  = Object.values(perQuestionScore).filter(s => s >= 0.5).length;
  const score    = totalQuestions > 0 ? Math.round((Object.values(perQuestionScore).reduce((a, b) => a + b, 0) / totalQuestions) * 100) : 0;
  const passed   = score >= quiz.passingScore;

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

  return NextResponse.json({ score, passed, correct, total: quiz.questions.length, correctAnswers, perQuestionScore, certificateIssued });
}
