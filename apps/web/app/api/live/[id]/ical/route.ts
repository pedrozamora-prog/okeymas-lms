import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildIcsContent } from "@/lib/calendar";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const cls = await prisma.liveClass.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      durationMins: true,
      roomUrl: true,
      organizationId: true,
    },
  });

  if (!cls) {
    return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  }

  const user = session.user as { organizationId?: string };
  if (cls.organizationId !== user.organizationId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const endAt = new Date(cls.scheduledAt.getTime() + cls.durationMins * 60 * 1000);

  const ics = buildIcsContent({
    title: cls.title,
    startAt: cls.scheduledAt,
    endAt,
    description: cls.roomUrl
      ? `Únete a la clase en: ${cls.roomUrl}`
      : "Clase en directo en Formia",
    location: cls.roomUrl ?? undefined,
    uid: `formia-live-${cls.id}@formia.app`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="formia-clase-${cls.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
