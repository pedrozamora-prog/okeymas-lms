import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/scorm/[lessonId]/runtime
// Returns saved CMI data for the current user + lesson
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { lessonId } = await params;

  try {
    const rows = await prisma.$queryRaw<{ data: Record<string, string> }[]>`
      SELECT data FROM scorm_data
      WHERE lesson_id = ${lessonId} AND user_id = ${user.id}
      LIMIT 1
    `;
    return NextResponse.json({ data: rows[0]?.data ?? {} });
  } catch {
    // scorm_data table may not exist yet
    return NextResponse.json({ data: {} });
  }
}

// POST /api/scorm/[lessonId]/runtime
// Saves CMI data. Triggers lesson completion when lesson_status = passed/completed.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json() as { data: Record<string, string> };

  if (!body?.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO scorm_data (id, lesson_id, user_id, data, updated_at)
      VALUES (gen_random_uuid()::text, ${lessonId}, ${user.id}, ${JSON.stringify(body.data)}::jsonb, NOW())
      ON CONFLICT (lesson_id, user_id)
      DO UPDATE SET data = ${JSON.stringify(body.data)}::jsonb, updated_at = NOW()
    `;

    // Mark lesson as completed when SCORM says so
    const status = body.data["cmi.core.lesson_status"] ?? body.data["cmi.completion_status"];
    const isCompleted = status === "passed" || status === "completed";

    if (isCompleted) {
      // Find the courseId for this lesson
      const lessonRow = await prisma.lesson.findFirst({
        where: { id: lessonId },
        select: { module: { select: { courseId: true } } },
      });
      const courseId = lessonRow?.module?.courseId;

      if (courseId) {
        await prisma.lessonProgress.upsert({
          where: { userId_lessonId: { userId: user.id, lessonId } },
          update: { completed: true, completedAt: new Date() },
          create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
        });

        // Check if course is fully completed
        await maybeCompleteCourse(user.id, courseId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SCORM runtime save error:", err);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

async function maybeCompleteCourse(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { modules: { include: { lessons: { select: { id: true } } } } },
  });
  if (!course) return;

  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  if (allLessonIds.length === 0) return;

  const completedCount = await prisma.lessonProgress.count({
    where: { userId, lessonId: { in: allLessonIds }, completed: true },
  });

  if (completedCount >= allLessonIds.length) {
    await prisma.enrollment.updateMany({
      where: { userId, courseId, status: "IN_PROGRESS" },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
}
