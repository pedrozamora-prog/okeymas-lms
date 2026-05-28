import { prisma } from "@/lib/prisma";
import { Role, Department } from "@prisma/client";
import { sendNewEnrollmentEmail } from "@/lib/email";

export async function applyEnrollmentRules(userId: string, organizationId: string, role: Role, department?: Department | null) {
  const [rules, org, user] = await Promise.all([
    prisma.enrollmentRule.findMany({
      where: {
        organizationId,
        isActive: true,
        AND: [
          { OR: [{ triggerRole: role }, { triggerRole: null }] },
          { OR: [{ triggerDept: department ?? undefined }, { triggerDept: null }] },
        ],
      },
      include: { course: { select: { title: true } } },
    }),
    prisma.organization.findUnique({ where: { id: organizationId }, select: { notifyNewEnrollment: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
  ]);

  if (rules.length === 0 || !user) return;

  for (const rule of rules) {
    const deadline = rule.daysToComplete
      ? new Date(Date.now() + rule.daysToComplete * 86400000)
      : null;

    const created = await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId: rule.courseId } },
      update: {},
      create: { userId, courseId: rule.courseId, autoEnrolled: true, deadline },
    });

    // Notificación in-app
    await prisma.notification.create({
      data: {
        userId,
        type:    "NEW_ENROLLMENT",
        title:   "Nueva formación asignada",
        message: `Se te ha inscrito en el curso "${rule.course.title}".`,
      },
    });

    // Email solo si la organización lo tiene activado
    if (org?.notifyNewEnrollment) {
      await sendNewEnrollmentEmail(user.email, user.name, rule.course.title, deadline);
    }
  }
}
