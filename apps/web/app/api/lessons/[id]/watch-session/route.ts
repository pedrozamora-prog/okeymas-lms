import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: lessonId } = await params;
  const body = await req.json() as {
    currentSecond: number;
    duration:      number;
    playbackSpeed: number;
  };

  const { currentSecond, duration, playbackSpeed } = body;
  if (typeof currentSecond !== "number" || typeof duration !== "number") {
    return NextResponse.json({ ok: true });
  }

  const existing = await prisma.videoWatchSession.upsert({
    where:  { lessonId_userId: { lessonId, userId: session.user.id } },
    create: {
      lessonId,
      userId:          session.user.id,
      watchedSegments: [[currentSecond, Math.min(currentSecond + 5, duration)]],
      totalWatchTime:  5,
      maxProgress:     duration > 0 ? (currentSecond / duration) * 100 : 0,
      playbackSpeeds:  [playbackSpeed ?? 1],
    },
    update: {},
  });

  const segments  = (existing.watchedSegments as number[][]) ?? [];
  const newEnd    = Math.min(currentSecond + 5, duration);
  const merged    = mergeSegments([...segments, [currentSecond, newEnd]]);
  const totalWatchTime  = merged.reduce((s, [a, b]) => s + (b - a), 0);
  const maxProgress     = duration > 0 ? Math.max(existing.maxProgress, (currentSecond / duration) * 100) : 0;
  const speeds          = (existing.playbackSpeeds as number[]) ?? [];
  const updatedSpeeds   = Array.from(new Set([...speeds, playbackSpeed ?? 1]));
  const prevMax         = merged.reduce((m, [, b]) => Math.max(m, b), 0);
  const isRewind        = currentSecond < prevMax - 10;

  await prisma.videoWatchSession.update({
    where: { lessonId_userId: { lessonId, userId: session.user.id } },
    data:  {
      watchedSegments: merged,
      totalWatchTime,
      maxProgress,
      playbackSpeeds:  updatedSpeeds,
      ...(isRewind ? { rewatchCount: { increment: 1 } } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: lessonId } = await params;
  const sessions = await prisma.videoWatchSession.findMany({
    where:  { lessonId },
    select: {
      watchedSegments: true,
      totalWatchTime:  true,
      maxProgress:     true,
      rewatchCount:    true,
      playbackSpeeds:  true,
      userId:          true,
    },
  });

  return NextResponse.json({ sessions });
}

function mergeSegments(segs: number[][]): number[][] {
  if (!segs.length) return [];
  const sorted = [...segs].sort((a, b) => a[0] - b[0]);
  const result: number[][] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1];
    if (sorted[i][0] <= last[1] + 2) last[1] = Math.max(last[1], sorted[i][1]);
    else result.push(sorted[i]);
  }
  return result;
}
