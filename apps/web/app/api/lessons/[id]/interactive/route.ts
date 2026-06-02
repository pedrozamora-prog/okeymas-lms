import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: lessonId } = await params;
  const points = await prisma.interactivePoint.findMany({
    where:   { lessonId },
    orderBy: { timestamp: "asc" },
  });
  return NextResponse.json({ points });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string };
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: lessonId } = await params;
  const body = await req.json() as {
    timestamp: number;
    question:  string;
    options:   { id: string; text: string; isCorrect: boolean }[];
    canSkip?:  boolean;
    skipAfter?: number | null;
  };

  if (!body.question || !body.options?.length) {
    return NextResponse.json({ error: "question and options required" }, { status: 400 });
  }

  const point = await prisma.interactivePoint.create({
    data: {
      lessonId,
      timestamp: body.timestamp,
      question:  body.question,
      options:   body.options,
      canSkip:   body.canSkip ?? false,
      skipAfter: body.skipAfter ?? null,
    },
  });
  return NextResponse.json({ point }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role?: string };
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await params;
  const { searchParams } = new URL(req.url);
  const pointId = searchParams.get("pointId");
  if (!pointId) return NextResponse.json({ error: "pointId required" }, { status: 400 });

  await prisma.interactivePoint.delete({ where: { id: pointId } });
  return NextResponse.json({ ok: true });
}
