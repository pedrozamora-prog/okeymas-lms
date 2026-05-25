import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

  const count = await prisma.module.count({ where: { courseId } });
  const module = await prisma.module.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      order: count,
      courseId,
    },
    include: { lessons: true },
  });

  return NextResponse.json(module, { status: 201 });
}
