import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Okeymas LMS <noreply@okeymas.com>";

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <!-- Header -->
        <tr><td style="background:#0C0C0C;padding:28px 32px">
          <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:4px;color:#ffffff;text-transform:uppercase">OKEYMAS</p>
          <p style="margin:2px 0 0;font-size:12px;font-weight:700;letter-spacing:4px;color:#FCE900;text-transform:uppercase">LMS</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
            © 2026 Okeymas LMS · Yelau Group — Madrid<br>
            Este es un mensaje automático, no respondas a este email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendNewEnrollmentEmail(to: string, userName: string, courseTitle: string, deadline?: Date | null) {
  if (!process.env.RESEND_API_KEY) return;
  const deadlineText = deadline
    ? `<p style="margin:16px 0 0;font-size:14px;color:#6b7280">⏰ Fecha límite: <strong>${deadline.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</strong></p>`
    : "";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Nueva formación asignada: ${courseTitle}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0C0C0C">Hola, ${userName} 👋</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px">Se te ha asignado un nuevo curso de formación:</p>
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-left:4px solid #FCE900;border-radius:8px;padding:20px">
        <p style="margin:0;font-size:17px;font-weight:700;color:#0C0C0C">${courseTitle}</p>
        ${deadlineText}
      </div>
      <p style="margin:24px 0 0;color:#6b7280;font-size:14px">Accede a tu panel de formación para comenzar el curso.</p>
    `),
  });
}

export async function sendDeadlineReminderEmail(to: string, userName: string, courseTitle: string, daysLeft: number) {
  if (!process.env.RESEND_API_KEY) return;
  const urgent = daysLeft <= 3;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠ Recuerda completar: ${courseTitle} (${daysLeft}d restantes)`,
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0C0C0C">${urgent ? "¡Atención!" : "Recordatorio"}, ${userName}</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px">Tienes una formación obligatoria pendiente de completar:</p>
      <div style="background:${urgent ? "#fef2f2" : "#fafafa"};border:1px solid ${urgent ? "#fca5a5" : "#e5e7eb"};border-left:4px solid ${urgent ? "#ef4444" : "#FCE900"};border-radius:8px;padding:20px">
        <p style="margin:0;font-size:17px;font-weight:700;color:#0C0C0C">${courseTitle}</p>
        <p style="margin:10px 0 0;font-size:14px;color:${urgent ? "#ef4444" : "#6b7280"};font-weight:600">
          ⏰ Te quedan <strong>${daysLeft} día${daysLeft !== 1 ? "s" : ""}</strong> para completarlo
        </p>
      </div>
      <p style="margin:24px 0 0;color:#6b7280;font-size:14px">Accede a tu panel de formación para continuar el curso.</p>
    `),
  });
}

export async function sendOverdueEmail(to: string, userName: string, courseTitle: string) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Formación vencida: ${courseTitle}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0C0C0C">Formación pendiente, ${userName}</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px">El plazo para completar la siguiente formación ha vencido:</p>
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-left:4px solid #ef4444;border-radius:8px;padding:20px">
        <p style="margin:0;font-size:17px;font-weight:700;color:#0C0C0C">${courseTitle}</p>
        <p style="margin:10px 0 0;font-size:13px;color:#ef4444;font-weight:600">⚠ Plazo vencido — Complétalo lo antes posible</p>
      </div>
      <p style="margin:24px 0 0;color:#6b7280;font-size:14px">Contacta con tu responsable si necesitas más tiempo.</p>
    `),
  });
}
