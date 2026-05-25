import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: moduleId } = await params;
  const body = await req.json();

  if (!body.title?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  if (!body.type) return NextResponse.json({ error: "Tipo requerido" }, { status: 400 });

  const count = await prisma.lesson.count({ where: { moduleId } });
  const lesson = await prisma.lesson.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      type: body.type,
      videoUrl: body.videoUrl?.trim() || null,
      fileUrl: body.fileUrl?.trim() || null,
      duration: body.duration ? Number(body.duration) : null,
      isRequired: body.isRequired ?? true,
      order: count,
      moduleId,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
