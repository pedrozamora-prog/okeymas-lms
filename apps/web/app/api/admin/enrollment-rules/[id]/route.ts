import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const rule = await prisma.enrollmentRule.findUnique({ where: { id } });
  if (!rule || rule.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.enrollmentRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { isActive } = await req.json();

  const rule = await prisma.enrollmentRule.findUnique({ where: { id } });
  if (!rule || rule.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updated = await prisma.enrollmentRule.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(updated);
}
