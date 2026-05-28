import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const check = await authorize(id, user.id, user.role, user.organizationId);
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
