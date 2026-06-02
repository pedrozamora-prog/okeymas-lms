import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await params;
  const { pointId, optionId } = await req.json() as { pointId: string; optionId: string };
  if (!pointId || !optionId) {
    return NextResponse.json({ error: "pointId and optionId required" }, { status: 400 });
  }

  const point = await prisma.interactivePoint.findUnique({
    where:  { id: pointId },
    select: { options: true },
  });
  if (!point) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const options = point.options as { id: string; isCorrect: boolean }[];
  const correct = options.find(o => o.id === optionId)?.isCorrect ?? false;

  await prisma.interactiveAnswer.upsert({
    where:  { interactivePointId_userId: { interactivePointId: pointId, userId: session.user.id } },
    create: { interactivePointId: pointId, userId: session.user.id, selectedOptionId: optionId, correct },
    update: { selectedOptionId: optionId, correct, answeredAt: new Date() },
  });

  return NextResponse.json({ correct });
}
