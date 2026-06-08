import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as { organizationId?: string; role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const scenarios = await (prisma as any).scenario.findMany({
    where:   { organizationId: user.organizationId },
    include: { _count: { select: { attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(scenarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { organizationId?: string; role?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title?.trim())           return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  if (!body.customerContext?.trim()) return NextResponse.json({ error: "Contexto del cliente requerido" }, { status: 400 });
  if (!body.objective?.trim())       return NextResponse.json({ error: "Objetivo requerido" }, { status: 400 });

  const scenario = await (prisma as any).scenario.create({
    data: {
      organizationId:  user.organizationId!,
      title:           body.title.trim(),
      description:     body.description?.trim() || null,
      customerContext: body.customerContext.trim(),
      objective:       body.objective.trim(),
      difficulty:      body.difficulty ?? "MEDIUM",
      isActive:        true,
    },
  });

  return NextResponse.json(scenario, { status: 201 });
}
