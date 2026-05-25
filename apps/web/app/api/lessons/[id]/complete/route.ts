import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;

  const already = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  });

  // Sumar puntos solo si es la primera vez
  if (!already?.completed) {
    await prisma.userPoints.upsert({
      where: { userId: user.id },
      create: { userId: user.id, total: 10 },
      update: { total: { increment: 10 } },
    });
  }

  // Comprobar si el curso está 100% completado → emitir certificado
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: { include: { lessons: { select: { id: true } } } },
            },
          },
        },
      },
    },
  });

  const course = lesson?.module?.course;
  if (course?.certificateEnabled) {
    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const completed = await prisma.lessonProgress.count({
      where: { userId: user.id, lessonId: { in: allLessonIds }, completed: true },
    });

    if (completed >= allLessonIds.length) {
      // Verificar que no tenga ya un certificado activo para este curso
      const existingCert = await prisma.certificate.findFirst({
        where: { userId: user.id, courseId: course.id },
      });

      if (!existingCert) {
        const expiresAt = course.certificateValidityDays
          ? new Date(Date.now() + course.certificateValidityDays * 86400000)
          : null;

        await prisma.certificate.create({
          data: {
            userId:      user.id,
            courseId:    course.id,
            courseTitle: course.title,
            type:        course.certificateType,
            expiresAt,
          },
        });

        return NextResponse.json({ ok: true, certificateIssued: true });
      }
    }
  }

  return NextResponse.json({ ok: true, certificateIssued: false });
}
