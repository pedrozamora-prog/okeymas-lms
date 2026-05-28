export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendDeadlineReminderEmail, sendOverdueEmail } from "@/lib/email";

// Vercel Cron llama a esta ruta cada día a las 9:00 AM
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();

  // Inscripciones activas con deadline, incluyendo config de notificaciones de la organización
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: { in: ["ENROLLED", "IN_PROGRESS"] },
      deadline: { not: null },
    },
    include: {
      user:   { select: { email: true, name: true, organizationId: true } },
      course: { select: { title: true } },
    },
  });

  // Cargar configuraciones de organizaciones involucradas
  const orgIds = [...new Set(enrollments.map(e => e.user.organizationId))];
  const orgs = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, notifyDeadline7d: true, notifyDeadline3d: true, notifyDeadline1d: true, notifyOverdue: true },
  });
  const orgMap = new Map(orgs.map(o => [o.id, o]));

  let reminded = 0;
  let overdue = 0;

  for (const enrollment of enrollments) {
    if (!enrollment.deadline) continue;
    const orgConfig = orgMap.get(enrollment.user.organizationId);
    const deadline = new Date(enrollment.deadline);
    const msLeft = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / 86400000);

    if (daysLeft < 0) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "EXPIRED" },
      });

      await prisma.notification.create({
        data: {
          userId:  enrollment.userId,
          type:    "MANDATORY_OVERDUE",
          title:   "Formación vencida",
          message: `El plazo para completar "${enrollment.course.title}" ha vencido.`,
        },
      });

      if (orgConfig?.notifyOverdue) {
        await sendOverdueEmail(enrollment.user.email, enrollment.user.name, enrollment.course.title);
      }
      overdue++;
    } else if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
      const shouldEmail =
        (daysLeft === 7 && orgConfig?.notifyDeadline7d) ||
        (daysLeft === 3 && orgConfig?.notifyDeadline3d) ||
        (daysLeft === 1 && orgConfig?.notifyDeadline1d);

      await prisma.notification.upsert({
        where: { id: `reminder-${enrollment.id}-${daysLeft}d` },
        update: {},
        create: {
          id:      `reminder-${enrollment.id}-${daysLeft}d`,
          userId:  enrollment.userId,
          type:    "DEADLINE_REMINDER",
          title:   `Recordatorio: ${daysLeft} día${daysLeft !== 1 ? "s" : ""} restantes`,
          message: `Te quedan ${daysLeft} día${daysLeft !== 1 ? "s" : ""} para completar "${enrollment.course.title}".`,
        },
      });

      if (shouldEmail) {
        await sendDeadlineReminderEmail(
          enrollment.user.email,
          enrollment.user.name,
          enrollment.course.title,
          daysLeft,
        );
      }
      reminded++;
    }
  }

  return NextResponse.json({ ok: true, reminded, overdue });
}
