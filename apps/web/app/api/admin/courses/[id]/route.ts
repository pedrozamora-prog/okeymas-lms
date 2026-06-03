import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

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

  const body = await req.json();
  const { title, description, thumbnailUrl, status, isRequired, daysToComplete, order,
          departments,
          certificateEnabled, certificateType, certificateValidityDays,
          certSignerName, certSignerTitle } = body;

  const updated = await prisma.course.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl?.trim() || null }),
      ...(status !== undefined && { status }),
      ...(isRequired !== undefined && { isRequired }),
      ...(daysToComplete !== undefined && { daysToComplete: daysToComplete ?? null }),
      ...(order !== undefined && { order }),
      ...(departments !== undefined && { departments }),
      ...(certificateEnabled !== undefined && { certificateEnabled }),
      ...(certificateType !== undefined && { certificateType }),
      ...(certificateValidityDays !== undefined && { certificateValidityDays: certificateValidityDays ?? null }),
      ...(certSignerName  !== undefined && { certSignerName:  certSignerName  ?? null }),
      ...(certSignerTitle !== undefined && { certSignerTitle: certSignerTitle ?? null }),
    },
  });

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
