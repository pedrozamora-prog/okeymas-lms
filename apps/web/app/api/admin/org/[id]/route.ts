import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (id !== user.organizationId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { name, logoUrl, notifyNewEnrollment, notifyDeadline7d, notifyDeadline3d, notifyDeadline1d, notifyOverdue } = body;

  const data: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    data.name = name.trim();
    data.logoUrl = logoUrl?.trim() || null;
  }

  if (notifyNewEnrollment !== undefined) data.notifyNewEnrollment = notifyNewEnrollment;
  if (notifyDeadline7d    !== undefined) data.notifyDeadline7d    = notifyDeadline7d;
  if (notifyDeadline3d    !== undefined) data.notifyDeadline3d    = notifyDeadline3d;
  if (notifyDeadline1d    !== undefined) data.notifyDeadline1d    = notifyDeadline1d;
  if (notifyOverdue       !== undefined) data.notifyOverdue       = notifyOverdue;

  const org = await prisma.organization.update({
    where: { id },
    data,
  });

  return NextResponse.json(org);
}
