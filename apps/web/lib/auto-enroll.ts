import { prisma } from "@/lib/prisma";
import { Role, Department } from "@prisma/client";

export async function applyEnrollmentRules(userId: string, organizationId: string, role: Role, department?: Department | null) {
  const rules = await prisma.enrollmentRule.findMany({
    where: {
      organizationId,
      isActive: true,
      AND: [
        { OR: [{ triggerRole: role }, { triggerRole: null }] },
        { OR: [{ triggerDept: department ?? undefined }, { triggerDept: null }] },
      ],
    },
  });

  if (rules.length === 0) return;

  for (const rule of rules) {
    const deadline = rule.daysToComplete
      ? new Date(Date.now() + rule.daysToComplete * 86400000)
      : null;

    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId: rule.courseId } },
      update: {},
      create: {
        userId,
        courseId:     rule.courseId,
        autoEnrolled: true,
        deadline,
      },
    });
  }
}
