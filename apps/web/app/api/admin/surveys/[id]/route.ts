import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/surveys/[id] — resultados de la encuesta
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const survey = await prisma.courseSurvey.findUnique({
    where:   { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      course: { select: { title: true } },
    },
  });

  if (!survey) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  return NextResponse.json(survey);
}
