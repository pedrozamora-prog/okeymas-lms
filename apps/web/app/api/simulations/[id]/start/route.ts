import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; organizationId?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: scenarioId } = await params;

  const scenario = await (prisma as any).scenario.findFirst({
    where: { id: scenarioId, organizationId: user.organizationId, isActive: true },
  });
  if (!scenario) return NextResponse.json({ error: "Escenario no encontrado" }, { status: 404 });

  const attempt = await (prisma as any).simulationAttempt.create({
    data: {
      userId:     user.id,
      scenarioId,
      transcript: [],
    },
  });

  return NextResponse.json({ attemptId: attempt.id, scenario });
}
