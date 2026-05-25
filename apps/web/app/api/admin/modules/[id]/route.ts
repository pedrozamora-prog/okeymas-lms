import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.module.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.order !== undefined && { order: body.order }),
    },
    include: { lessons: { orderBy: { order: "asc" } } },
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
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
