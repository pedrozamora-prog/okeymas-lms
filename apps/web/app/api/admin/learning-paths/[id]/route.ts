import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function authorizeAndGet(pathId: string, orgId: string) {
  const path = await prisma.learningPath.findUnique({ where: { id: pathId } });
  if (!path) return { error: "Ruta no encontrada", status: 404 };
  if (path.organizationId !== orgId) return { error: "No autorizado", status: 403 };
  return { path };
}

// PATCH — update title/description/isActive + replace full course list with branching
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const check = await authorizeAndGet(id, user.organizationId);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const { title, description, isActive, courses } = await req.json();
  // courses: [{ courseId, order, onFailGoTo? }]

  await prisma.learningPath.update({
    where: { id },
    data: {
      ...(title       !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(isActive    !== undefined && { isActive }),
    },
  });

  if (Array.isArray(courses)) {
    // Replace all courses in path
    await prisma.learningPathCourse.deleteMany({ where: { pathId: id } });
    for (const c of courses) {
      await prisma.learningPathCourse.create({
        data: {
          pathId:    id,
          courseId:  c.courseId,
          order:     c.order ?? 0,
          onFailGoTo: c.onFailGoTo ?? null,
        },
      });
    }
  }

  const updated = await prisma.learningPath.findUnique({
    where: { id },
    include: {
      courses: {
        include: { course: { select: { id: true, title: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const check = await authorizeAndGet(id, user.organizationId);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.learningPath.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
