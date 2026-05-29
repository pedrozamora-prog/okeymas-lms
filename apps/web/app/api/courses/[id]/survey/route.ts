import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET — obtiene la encuesta del curso (para el alumno)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: courseId } = await params;

  const survey = await prisma.courseSurvey.findUnique({
    where:   { courseId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!survey || !survey.isActive) return NextResponse.json(null);

  // Ver si ya respondió
  const existing = await prisma.surveyResponse.findUnique({
    where: { surveyId_userId: { surveyId: survey.id, userId: user.id } },
  });

  return NextResponse.json({ survey, alreadyAnswered: !!existing });
}

// POST — guarda la respuesta del alumno
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: courseId } = await params;
  const { surveyId, answers } = await req.json();

  await prisma.surveyResponse.upsert({
    where:  { surveyId_userId: { surveyId, userId: user.id } },
    update: { answers },
    create: { surveyId, userId: user.id, answers },
  });

  return NextResponse.json({ ok: true });
}
