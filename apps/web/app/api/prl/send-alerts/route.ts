import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { differenceInDays } from "date-fns";
import { Resend } from "resend";

export async function POST() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string; name?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { name: true, resendApiKey: true, emailFromName: true, emailFromAddress: true },
  });

  const prlCourses = await prisma.course.findMany({
    where: { organizationId: user.organizationId, isPrl: true, status: "PUBLISHED" },
    select: { id: true, title: true },
  });

  if (!prlCourses.length) return NextResponse.json({ sent: 0 });

  const employees = await prisma.user.findMany({
    where: { organizationId: user.organizationId, isActive: true },
    select: { id: true, name: true, email: true },
  });

  const certificates = await prisma.certificate.findMany({
    where: {
      courseId: { in: prlCourses.map(c => c.id) },
      userId:   { in: employees.map(e => e.id) },
    },
    select: { userId: true, courseId: true, issuedAt: true, expiresAt: true },
    orderBy: { issuedAt: "desc" },
  });

  const certMap = new Map<string, { expiresAt: Date | null }>();
  for (const c of certificates) {
    const key = `${c.userId}:${c.courseId}`;
    if (!certMap.has(key)) certMap.set(key, { expiresAt: c.expiresAt });
  }

  const now = new Date();
  const alerts: { employee: { id: string; name: string; email: string }; courseTitle: string; type: "warning" | "expired" | "missing" }[] = [];

  for (const emp of employees) {
    for (const course of prlCourses) {
      const cert = certMap.get(`${emp.id}:${course.id}`);
      if (!cert) {
        alerts.push({ employee: emp, courseTitle: course.title, type: "missing" });
        continue;
      }
      if (!cert.expiresAt) continue;
      if (cert.expiresAt < now) {
        alerts.push({ employee: emp, courseTitle: course.title, type: "expired" });
      } else if (differenceInDays(cert.expiresAt, now) <= 30) {
        alerts.push({ employee: emp, courseTitle: course.title, type: "warning" });
      }
    }
  }

  if (!alerts.length) return NextResponse.json({ sent: 0 });

  // Crear notificaciones en BD
  await prisma.notification.createMany({
    data: alerts.map(a => ({
      userId:   a.employee.id,
      type:     a.type === "warning" ? "PRL_EXPIRY_WARNING" : "PRL_EXPIRED",
      title:    a.type === "warning"
        ? `Tu formación PRL vence pronto: ${a.courseTitle}`
        : a.type === "expired"
        ? `Formación PRL vencida: ${a.courseTitle}`
        : `Formación PRL pendiente: ${a.courseTitle}`,
      message:  a.type === "warning"
        ? `Tu certificado de "${a.courseTitle}" vence en menos de 30 días. Renueva tu formación para mantener el cumplimiento legal.`
        : a.type === "expired"
        ? `Tu certificado de "${a.courseTitle}" ha vencido. Es obligatorio renovar esta formación PRL según la Ley 31/1995.`
        : `Tienes pendiente la formación PRL "${a.courseTitle}", obligatoria según la Ley 31/1995.`,
      sentEmail: false,
    })),
    skipDuplicates: true,
  });

  // Enviar emails si hay Resend configurado
  let emailsSent = 0;
  if (org?.resendApiKey) {
    const resend = new Resend(org.resendApiKey);
    const fromAddress = org.emailFromAddress ?? "noreply@formia.dev";
    const fromName    = org.emailFromName    ?? "Formia PRL";

    for (const a of alerts) {
      const subject = a.type === "warning"
        ? `⚠️ Tu formación PRL vence pronto — ${a.courseTitle}`
        : a.type === "expired"
        ? `🔴 Formación PRL vencida — ${a.courseTitle}`
        : `📋 Formación PRL pendiente — ${a.courseTitle}`;

      const html = `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#111">
          <div style="background:#0C0C0C;padding:28px 32px;border-radius:12px 12px 0 0">
            <p style="color:#A855F7;font-weight:900;font-size:16px;margin:0">Formia · PRL</p>
          </div>
          <div style="background:#f8f8f8;padding:32px;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 12px;font-size:20px">${subject}</h2>
            <p style="color:#555;line-height:1.6">Hola <strong>${a.employee.name}</strong>,</p>
            <p style="color:#555;line-height:1.6">
              ${a.type === "missing"
                ? `Tienes pendiente la formación PRL <strong>"${a.courseTitle}"</strong>. Esta formación es obligatoria según la Ley 31/1995 de Prevención de Riesgos Laborales.`
                : a.type === "expired"
                ? `Tu certificado de la formación PRL <strong>"${a.courseTitle}"</strong> ha <strong style="color:#ef4444">vencido</strong>. Es obligatorio renovar esta formación.`
                : `Tu certificado de la formación PRL <strong>"${a.courseTitle}"</strong> vence en menos de <strong>30 días</strong>. Renueva cuanto antes.`
              }
            </p>
            <div style="margin:24px 0;padding:16px;background:#fff3cd;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#444">
              <strong>Marco legal:</strong> Ley 31/1995 LPRL · Incumplimiento: sanción de €2.046 a €40.985.
            </div>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;background:#A855F7;color:#fff;padding:12px 24px;border-radius:8px;font-weight:700;text-decoration:none">
              Acceder a la plataforma →
            </a>
          </div>
        </div>`;

      try {
        await resend.emails.send({ from: `${fromName} <${fromAddress}>`, to: a.employee.email, subject, html });
        emailsSent++;
      } catch { /* continue */ }
    }
  }

  return NextResponse.json({ sent: alerts.length, emailsSent });
}
