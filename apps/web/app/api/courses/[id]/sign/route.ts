import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAuditLog } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; organizationId?: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: courseId } = await params;
  const { signatureData } = await req.json();

  if (!signatureData || typeof signatureData !== "string") {
    return NextResponse.json({ error: "Firma requerida" }, { status: 400 });
  }

  // Validate it's a base64 PNG (starts with data:image/png;base64,)
  if (!signatureData.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Formato de firma inválido" }, { status: 400 });
  }

  // Check the course exists and requires signature
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, signatureEnabled: true, certificateEnabled: true, certificateType: true, certificateValidityDays: true },
  });

  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  if (!course.signatureEnabled) return NextResponse.json({ error: "Este curso no requiere firma" }, { status: 400 });

  // Check enrollment exists
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment) return NextResponse.json({ error: "No estás inscrito en este curso" }, { status: 403 });

  const hdrs = await headers();
  const ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ?? hdrs.get("x-real-ip") ?? undefined;
  const userAgent = hdrs.get("user-agent") ?? undefined;

  // Save signature (upsert in case they re-sign)
  await prisma.courseSignature.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId, signatureData, ipAddress, userAgent },
    update: { signatureData, ipAddress, userAgent, signedAt: new Date() },
  });

  // Now issue certificate if enabled
  let certificateIssued = false;
  if (course.certificateEnabled) {
    const existingCert = await prisma.certificate.findFirst({
      where: { userId: user.id, courseId },
    });
    if (!existingCert) {
      const expiresAt = course.certificateValidityDays
        ? new Date(Date.now() + course.certificateValidityDays * 86400000)
        : null;
      await prisma.certificate.create({
        data: { userId: user.id, courseId, courseTitle: course.title, type: course.certificateType, expiresAt },
      });
      if (user.organizationId) {
        await dispatchWebhook(user.organizationId, "CERTIFICATE_ISSUED", {
          userId: user.id, courseId, courseTitle: course.title,
        });
      }
      certificateIssued = true;
    }
  }

  await createAuditLog({
    action: "ENROLLMENT_COMPLETED",
    userId: user.id,
    organizationId: user.organizationId,
    entity: "CourseSignature",
    entityId: courseId,
    metadata: { courseTitle: course.title, signed: true },
  });

  return NextResponse.json({ ok: true, certificateIssued });
}
