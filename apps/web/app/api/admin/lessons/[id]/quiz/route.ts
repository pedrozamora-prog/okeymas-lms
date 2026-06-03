import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface QuestionInput {
  text:        string;
  type?:       string;
  imageUrl?:   string | null;
  modelAnswer?: string | null;
  explanation?: string | null;
  options:     { text: string; isCorrect: boolean }[];
}

// GET — obtener quiz existente para el editor
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: lessonId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where:   { lessonId },
    include: {
      questions: {
        include:  { options: { orderBy: { order: "asc" } } },
        orderBy:  { order: "asc" },
      },
    },
  });

  return NextResponse.json(quiz ?? null);
}

// POST — crear o reemplazar quiz completo
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: lessonId } = await params;
  const body = await req.json();
  const questions: QuestionInput[] = body.questions ?? [];
  const passingScore: number = body.passingScore ?? 70;
  const maxAttempts:  number = body.maxAttempts  ?? 3;
  const timeLimitMins: number | null = body.timeLimitMins ?? null;

  if (questions.length === 0) {
    return NextResponse.json({ error: "Se necesita al menos una pregunta" }, { status: 400 });
  }

  // Validar según tipo de pregunta
  const noCorrectTypes = ["ORDER_ITEMS", "FILL_BLANK", "FREE_TEXT"];
  for (const q of questions) {
    const qtype = q.type ?? "MULTIPLE_CHOICE";
    if (noCorrectTypes.includes(qtype)) continue;
    const correctCount = q.options.filter(o => o.isCorrect).length;
    if (correctCount !== 1) {
      return NextResponse.json(
        { error: `La pregunta "${q.text.slice(0, 40)}…" debe tener exactamente 1 respuesta correcta` },
        { status: 400 }
      );
    }
  }

  // Upsert quiz (borrar preguntas existentes y recrear)
  const quiz = await prisma.quiz.upsert({
    where:  { lessonId },
    update: { passingScore, maxAttempts, timeLimitMins },
    create: { lessonId, passingScore, maxAttempts, timeLimitMins },
  });

  // Borrar preguntas anteriores (cascade borra las opciones)
  await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

  // Crear nuevas preguntas y opciones
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const question = await prisma.quizQuestion.create({
      data: {
        quizId:      quiz.id,
        text:        q.text,
        type:        (q.type ?? "MULTIPLE_CHOICE") as never,
        imageUrl:    q.imageUrl    ?? null,
        modelAnswer: q.modelAnswer ?? null,
        explanation: q.explanation ?? null,
        order:       qi,
      },
    });
    for (let oi = 0; oi < q.options.length; oi++) {
      await prisma.quizOption.create({
        data: {
          questionId: question.id,
          text:       q.options[oi].text,
          isCorrect:  q.options[oi].isCorrect,
          order:      oi,
        },
      });
    }
  }

  const saved = await prisma.quiz.findUnique({
    where:   { lessonId },
    include: { questions: { include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });

  return NextResponse.json(saved);
}
