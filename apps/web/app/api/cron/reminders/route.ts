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

  // Inscripciones activas con deadline
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: { in: ["ENROLLED", "IN_PROGRESS"] },
      deadline: { not: null },
    },
    include: {
      user:   { select: { email: true, name: true } },
      course: { select: { title: true } },
    },
  });

  let reminded = 0;
  let overdue = 0;

  for (const enrollment of enrollments) {
    if (!enrollment.deadline) continue;
    const deadline = new Date(enrollment.deadline);
    const msLeft = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / 86400000);

    if (daysLeft < 0) {
      // Vencido — cambiar estado y notificar
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "EXPIRED" },
      });

      // Crear notificación in-app
      await prisma.notification.create({
        data: {
          userId:  enrollment.userId,
          type:    "MANDATORY_OVERDUE",
          title:   "Formación vencida",
          message: `El plazo para completar "${enrollment.course.title}" ha vencido.`,
        },
      });

      await sendOverdueEmail(enrollment.user.email, enrollment.user.name, enrollment.course.title);
      overdue++;
    } else if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
      // Recordatorio en días clave
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

      await sendDeadlineReminderEmail(
        enrollment.user.email,
        enrollment.user.name,
        enrollment.course.title,
        daysLeft,
      );
      reminded++;
    }
  }

  return NextResponse.json({ ok: true, reminded, overdue });
}
