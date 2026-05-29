import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/surveys — crea o actualiza la encuesta de un curso
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { courseId, questions, isActive } = await req.json();
  if (!courseId) return NextResponse.json({ error: "courseId requerido" }, { status: 400 });

  // Verificar que el curso pertenece a la organización
  const course = await prisma.course.findFirst({
    where: { id: courseId, organizationId: user.organizationId },
  });
  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  // Upsert encuesta
  const survey = await prisma.courseSurvey.upsert({
    where:  { courseId },
    update: { isActive: isActive ?? true },
    create: { courseId, isActive: isActive ?? true },
  });

  // Reemplazar preguntas
  if (questions) {
    await prisma.surveyQuestion.deleteMany({ where: { surveyId: survey.id } });
    await prisma.surveyQuestion.createMany({
      data: questions.map((q: { text: string; type: string; options?: string[]; order: number }) => ({
        surveyId: survey.id,
        text:     q.text,
        type:     q.type,
        options:  q.options ?? [],
        order:    q.order,
      })),
    });
  }

  const result = await prisma.courseSurvey.findUnique({
    where:   { id: survey.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(result, { status: 201 });
}
