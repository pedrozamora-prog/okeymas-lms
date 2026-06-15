import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"];

// PATCH /api/admin/live/[id] — editar clase
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.liveClass.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json() as {
    title?: string;
    scheduledAt?: string;
    durationMins?: number;
    instructorId?: string;
    roomUrl?: string;
    recordingUrl?: string;
  };

  const updated = await prisma.liveClass.update({
    where: { id },
    data: {
      ...(body.title        ? { title: body.title.trim() }           : {}),
      ...(body.scheduledAt  ? { scheduledAt: new Date(body.scheduledAt) } : {}),
      ...(body.durationMins ? { durationMins: body.durationMins }    : {}),
      ...(body.instructorId ? { instructorId: body.instructorId }    : {}),
      ...(body.roomUrl      !== undefined ? { roomUrl: body.roomUrl?.trim() || null } : {}),
      ...(body.recordingUrl !== undefined ? { recordingUrl: body.recordingUrl?.trim() || null } : {}),
    },
    include: { instructor: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/live/[id] — eliminar clase
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.liveClass.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.liveClass.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
