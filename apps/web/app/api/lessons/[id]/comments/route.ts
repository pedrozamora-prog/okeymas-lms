import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;

  const comments = await prisma.lessonComment.findMany({
    where:   { lessonId, parentId: null },
    include: {
      user:    { select: { id: true, name: true } },
      replies: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: lessonId } = await params;
  const { text, parentId } = await req.json();

  if (!text?.trim()) return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 });

  const comment = await prisma.lessonComment.create({
    data: {
      text: text.trim(),
      lessonId,
      userId: user.id,
      parentId: parentId ?? null,
    },
    include: {
      user:    { select: { id: true, name: true } },
      replies: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { commentId } = await req.json();

  const comment = await prisma.lessonComment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isOwner = comment.userId === user.id;
  const isAdmin = ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await prisma.lessonComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
