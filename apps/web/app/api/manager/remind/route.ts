import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendDeadlineReminderEmail, sendOverdueEmail, OrgEmailConfig } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;

  if (!user || !["MANAGER", "SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { userId, courseId } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "userId y courseId son obligatorios" }, { status: 400 });
  }

  // Verificar que el empleado pertenece a la misma org
  const [employee, enrollment, org] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, organizationId: user.organizationId },
      select: { name: true, email: true },
    }),
    prisma.enrollment.findFirst({
      where:   { userId, courseId },
      include: { course: { select: { title: true } } },
    }),
    prisma.organization.findUnique({
      where:  { id: user.organizationId },
      select: { emailFromName: true, emailFromAddress: true, emailReplyTo: true, resendApiKey: true },
    }),
  ]);

  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  if (!enrollment) return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
  if (enrollment.status === "COMPLETED") {
    return NextResponse.json({ error: "El empleado ya ha completado este curso" }, { status: 400 });
  }

  const cfg: OrgEmailConfig = {
    fromName:    org?.emailFromName,
    fromAddress: org?.emailFromAddress,
    replyTo:     org?.emailReplyTo,
    resendApiKey: org?.resendApiKey,
  };

  const now      = new Date();
  const isOverdue = enrollment.deadline && enrollment.deadline < now;
  const daysLeft  = enrollment.deadline
    ? Math.ceil((enrollment.deadline.getTime() - now.getTime()) / 86400000)
    : null;

  if (isOverdue) {
    await sendOverdueEmail(employee.email, employee.name, enrollment.course.title, cfg);
  } else {
    await sendDeadlineReminderEmail(
      employee.email,
      employee.name,
      enrollment.course.title,
      daysLeft ?? 7,
      cfg,
    );
  }

  // Notificación in-app
  await prisma.notification.create({
    data: {
      userId,
      type:    "DEADLINE_REMINDER",
      title:   "Recordatorio de formación",
      message: `Se te ha enviado un recordatorio sobre el curso "${enrollment.course.title}".`,
    },
  });

  return NextResponse.json({ ok: true });
}
