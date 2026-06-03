import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id: string }).id;

  try {
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: id } },
      create: { userId, courseId: id },
      update: {},
    });

    await createAuditLog({
      action: "ENROLLMENT_CREATED",
      userId,
      entity: "Enrollment",
      entityId: enrollment.id,
      metadata: { courseId: id },
    });

    return NextResponse.json(enrollment);
  } catch {
    return NextResponse.json({ error: "Error al inscribirse" }, { status: 500 });
  }
}
