import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = ["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"];

// GET /api/admin/live — lista todas las clases de la organización
export async function GET(_req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const classes = await prisma.liveClass.findMany({
    where: { organizationId: user.organizationId },
    include: {
      instructor: { select: { id: true, name: true } },
      _count: { select: { attendance: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(classes);
}

// POST /api/admin/live — crear nueva clase
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !ALLOWED.includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as {
    title: string;
    scheduledAt: string;
    durationMins?: number;
    instructorId?: string;
    roomUrl?: string;
  };

  if (!body.title?.trim() || !body.scheduledAt) {
    return NextResponse.json({ error: "Título y fecha son obligatorios" }, { status: 400 });
  }

  const cls = await prisma.liveClass.create({
    data: {
      title:        body.title.trim(),
      scheduledAt:  new Date(body.scheduledAt),
      durationMins: body.durationMins ?? 60,
      instructorId: body.instructorId ?? user.id,
      roomUrl:      body.roomUrl?.trim() || null,
      organizationId: user.organizationId,
    },
    include: { instructor: { select: { id: true, name: true } } },
  });

  return NextResponse.json(cls, { status: 201 });
}
