import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where:   { id },
    include: { module: { include: { course: { select: { title: true } } } } },
  });
  if (!lesson) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Fetch audioNarrationUrl via raw SQL (column added after client generation)
  const audioRow = await prisma.$queryRaw<{ audio_narration_url: string | null }[]>`
    SELECT audio_narration_url FROM lessons WHERE id = ${id}
  `;
  return NextResponse.json({ ...lesson, audioNarrationUrl: audioRow[0]?.audio_narration_url ?? null });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.lesson.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl?.trim() || null }),
      ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl?.trim() || null }),
      ...(body.duration !== undefined && { duration: body.duration ? Number(body.duration) : null }),
      ...(body.isRequired !== undefined && { isRequired: body.isRequired }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.content !== undefined && { content: body.content }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
