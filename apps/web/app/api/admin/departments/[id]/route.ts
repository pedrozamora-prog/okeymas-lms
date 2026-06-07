import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept || dept.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept || dept.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
  }

  try {
    const updated = await prisma.department.update({
      where: { id },
      data:  { name: name.trim() },
      select: { id: true, name: true, _count: { select: { users: true } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Ya existe un departamento con ese nombre" }, { status: 409 });
  }
}
