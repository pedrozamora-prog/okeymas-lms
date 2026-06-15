import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;

  const rows = await prisma.$queryRaw<{ content: string; updated_at: Date }[]>`
    SELECT content, updated_at
    FROM   lesson_notes
    WHERE  user_id   = ${user.id}
    AND    lesson_id = ${lessonId}
    LIMIT  1
  `;

  return NextResponse.json({ content: rows[0]?.content ?? "", updatedAt: rows[0]?.updated_at ?? null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;
  const { content } = await req.json() as { content: string };

  await prisma.$executeRaw`
    INSERT INTO lesson_notes (user_id, lesson_id, content, updated_at)
    VALUES (${user.id}, ${lessonId}, ${content ?? ""}, NOW())
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET content = ${content ?? ""}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
