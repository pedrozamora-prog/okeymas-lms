import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ scenarioId: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; organizationId?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { scenarioId } = await params;

  const scenario = await (prisma as any).scenario.findFirst({
    where:  { id: scenarioId, organizationId: user.organizationId, isActive: true },
    select: { id: true, title: true, description: true, objective: true, difficulty: true },
  });

  if (!scenario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(scenario);
}
