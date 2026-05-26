import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { userId, courseId, type, validityDays } = await req.json();
  if (!userId || !courseId || !type) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  // Verificar que el usuario y el curso pertenecen a la organización
  const [targetUser, course] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId, organizationId: user.organizationId } }),
    prisma.course.findFirst({ where: { id: courseId, organizationId: user.organizationId } }),
  ]);

  if (!targetUser || !course) {
    return NextResponse.json({ error: "Usuario o curso no encontrado" }, { status: 404 });
  }

  const expiresAt = validityDays
    ? new Date(Date.now() + Number(validityDays) * 86400000)
    : null;

  try {
    const cert = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        courseTitle: course.title,
        type,
        expiresAt,
      },
    });
    return NextResponse.json(cert);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[certificates] create error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    await prisma.certificate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[certificates] delete error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
