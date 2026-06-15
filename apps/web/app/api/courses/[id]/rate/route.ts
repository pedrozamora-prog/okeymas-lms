import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: courseId } = await params;
  const { rating, comment } = await req.json() as { rating: number; comment?: string };

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Valoración inválida" }, { status: 400 });
  }

  // Verificar que el usuario tiene el curso completado
  const enrollment = await prisma.enrollment.findUnique({
    where:  { userId_courseId: { userId: user.id, courseId } },
    select: { status: true },
  });
  if (!enrollment || enrollment.status !== "COMPLETED") {
    return NextResponse.json({ error: "Completa el curso antes de valorarlo" }, { status: 400 });
  }

  await prisma.$executeRaw`
    UPDATE enrollments
    SET    rating = ${rating},
           rating_comment = ${comment ?? null},
           rated_at       = NOW()
    WHERE  "userId" = ${user.id}
    AND    "courseId" = ${courseId}
  `;

  return NextResponse.json({ ok: true });
}

// GET: media de valoraciones (para admins)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user?.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: courseId } = await params;

  const rows = await prisma.$queryRaw<{ avg: number | null; count: bigint }[]>`
    SELECT AVG(rating)::FLOAT AS avg, COUNT(*) AS count
    FROM   enrollments
    WHERE  "courseId" = ${courseId}
    AND    rating IS NOT NULL
  `;

  const avg   = rows[0]?.avg   ? Math.round(rows[0].avg * 10) / 10 : null;
  const count = Number(rows[0]?.count ?? 0);

  return NextResponse.json({ avg, count });
}
