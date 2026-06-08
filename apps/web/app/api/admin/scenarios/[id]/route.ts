import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { organizationId?: string; role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json();

  const scenario = await (prisma as any).scenario.updateMany({
    where: { id, organizationId: user.organizationId },
    data: {
      ...(body.title           !== undefined && { title:           body.title.trim() }),
      ...(body.description     !== undefined && { description:     body.description?.trim() || null }),
      ...(body.customerContext !== undefined && { customerContext: body.customerContext.trim() }),
      ...(body.objective       !== undefined && { objective:       body.objective.trim() }),
      ...(body.difficulty      !== undefined && { difficulty:      body.difficulty }),
      ...(body.isActive        !== undefined && { isActive:        body.isActive }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(scenario);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { organizationId?: string; role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await (prisma as any).scenario.deleteMany({
    where: { id, organizationId: user.organizationId },
  });

  return NextResponse.json({ ok: true });
}
