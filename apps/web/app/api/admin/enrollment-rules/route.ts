import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rules = await prisma.enrollmentRule.findMany({
    where: { organizationId: user.organizationId },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { courseId, triggerRole, triggerDept, daysToComplete, enrollExisting } = await req.json();
  if (!courseId) return NextResponse.json({ error: "Curso requerido" }, { status: 400 });

  const rule = await prisma.enrollmentRule.create({
    data: {
      courseId,
      organizationId: user.organizationId,
      triggerRole:    triggerRole || null,
      triggerDept:    triggerDept || null,
      daysToComplete: daysToComplete ? Number(daysToComplete) : null,
    },
    include: { course: { select: { id: true, title: true } } },
  });

  // Si se pide inscribir a los existentes que cumplan el filtro
  if (enrollExisting) {
    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
      isActive: true,
    };
    if (triggerRole) where.role = triggerRole;
    if (triggerDept) where.department = triggerDept;

    const targetUsers = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    const deadline = daysToComplete
      ? new Date(Date.now() + Number(daysToComplete) * 86400000)
      : null;

    for (const u of targetUsers) {
      await prisma.enrollment.upsert({
        where:  { userId_courseId: { userId: u.id, courseId } },
        update: {},
        create: {
          userId: u.id,
          courseId,
          autoEnrolled: true,
          deadline,
        },
      });
    }
  }

  return NextResponse.json(rule, { status: 201 });
}
