import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { CourseStatus } from "@prisma/client";

async function authorize(courseId: string, userId: string, role: string, orgId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Curso no encontrado", status: 404 };
  if (course.organizationId !== orgId) return { error: "No autorizado", status: 403 };
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(role)) return { error: "No autorizado", status: 403 };
  return { course };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const check = await authorize(id, user.id, user.role, user.organizationId);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { title, description, thumbnailUrl, status, isRequired, daysToComplete, order,
          departments,
          certificateEnabled, certificateType, certificateValidityDays,
          certSignerName, certSignerTitle, signatureEnabled,
          isPrl, prlRiskLevel,
          isPublic, price, currency } = body as Record<string, unknown>;

  let updated;
  try {
    updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: (title as string).trim() }),
        ...(description !== undefined && { description: (description as string)?.trim() || null }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl: (thumbnailUrl as string)?.trim() || null }),
        ...(status !== undefined && { status: status as CourseStatus }),
        ...(isRequired !== undefined && { isRequired: isRequired as boolean }),
        ...(daysToComplete !== undefined && { daysToComplete: (daysToComplete as number) ?? null }),
        ...(order !== undefined && { order: order as number }),
        ...(departments !== undefined && {
          departments: { set: (departments as string[]).map(id => ({ id })) },
        }),
        ...(certificateEnabled !== undefined && { certificateEnabled: certificateEnabled as boolean }),
        ...(certificateType !== undefined && { certificateType: certificateType as string }),
        ...(certificateValidityDays !== undefined && { certificateValidityDays: (certificateValidityDays as number) ?? null }),
        ...(certSignerName  !== undefined && { certSignerName:  (certSignerName  as string) ?? null }),
        ...(certSignerTitle !== undefined && { certSignerTitle: (certSignerTitle as string) ?? null }),
        ...(signatureEnabled !== undefined && { signatureEnabled: signatureEnabled as boolean }),
        ...(isPrl !== undefined && { isPrl: isPrl as boolean }),
        ...(prlRiskLevel !== undefined && { prlRiskLevel: (prlRiskLevel as string) ?? null }),
        ...(isPublic !== undefined && { isPublic: isPublic as boolean }),
        ...(price !== undefined && { price: (price as number) ?? null }),
        ...(currency !== undefined && { currency: (currency as string) ?? "eur" }),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/courses]", err);
    const msg = err instanceof Error ? err.message : "Error al guardar el curso";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const auditAction = status === "PUBLISHED" ? "COURSE_PUBLISHED"
    : status === "ARCHIVED" ? "COURSE_ARCHIVED"
    : "COURSE_UPDATED";

  await createAuditLog({
    action: auditAction,
    userId: user.id,
    organizationId: user.organizationId,
    entity: "Course",
    entityId: id,
    metadata: { title: updated.title, status: updated.status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const check = await authorize(id, user.id, user.role, user.organizationId);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const course = check.course!;
  await prisma.course.delete({ where: { id } });

  await createAuditLog({
    action: "COURSE_DELETED",
    userId: user.id,
    organizationId: user.organizationId,
    entity: "Course",
    entityId: id,
    metadata: { title: course.title },
  });

  return NextResponse.json({ ok: true });
}
