import { Resend } from "resend";

export interface OrgEmailConfig {
  fromName?:     string | null;
  fromAddress?:  string | null;
  replyTo?:      string | null;
  resendApiKey?: string | null;
}

const PLATFORM_FROM_NAME    = "FitAcademy";
const PLATFORM_FROM_ADDRESS = "noreply@fitacademy.com";

function getResend(apiKey?: string | null) {
  const key = apiKey || process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function buildFrom(cfg?: OrgEmailConfig) {
  const name    = cfg?.fromName    || PLATFORM_FROM_NAME;
  const address = cfg?.fromAddress || PLATFORM_FROM_ADDRESS;
  return `${name} <${address}>`;
}

function baseTemplate(content: string, orgName?: string) {
  const displayName = orgName || PLATFORM_FROM_NAME;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <!-- Header -->
        <tr><td style="background:#0C0C0C;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:900;font-family:Arial Black,sans-serif"><span style="color:#FCE900">Fit</span><span style="color:#ffffff">Academy</span></p>
          <p style="margin:4px 0 0;font-size:10px;font-weight:400;letter-spacing:3px;color:#888888;text-transform:uppercase">Learning Platform</p>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
            © ${new Date().getFullYear()} ${displayName} · FitAcademy Learning Platform<br>
            Este es un mensaje automático, no respondas a este email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendNewEnrollmentEmail(
  to: string,
  userName: string,
  courseTitle: string,
  deadline?: Date | null,
  cfg?: OrgEmailConfig,
) {
  const resend = getResend(cfg?.resendApiKey);
  if (!resend) return;

  const deadlineText = deadline
    ? `<p style="margin:16px 0 0;font-size:14px;color:#6b7280">⏰ Fecha límite: <strong>${deadline.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</strong></p>`
    : "";

  const extra: Record<string, string> = {};
  if (cfg?.replyTo) extra.replyTo = cfg.replyTo;

  await resend.emails.send({
    from: buildFrom(cfg),
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
    `, cfg?.fromName ?? undefined),
    ...extra,
  });
}

export async function sendDeadlineReminderEmail(
  to: string,
  userName: string,
  courseTitle: string,
  daysLeft: number,
  cfg?: OrgEmailConfig,
) {
  const resend = getResend(cfg?.resendApiKey);
  if (!resend) return;

  const urgent = daysLeft <= 3;
  const extra: Record<string, string> = {};
  if (cfg?.replyTo) extra.replyTo = cfg.replyTo;

  await resend.emails.send({
    from: buildFrom(cfg),
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
    `, cfg?.fromName ?? undefined),
    ...extra,
  });
}

export async function sendOverdueEmail(
  to: string,
  userName: string,
  courseTitle: string,
  cfg?: OrgEmailConfig,
) {
  const resend = getResend(cfg?.resendApiKey);
  if (!resend) return;

  const extra: Record<string, string> = {};
  if (cfg?.replyTo) extra.replyTo = cfg.replyTo;

  await resend.emails.send({
    from: buildFrom(cfg),
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
    `, cfg?.fromName ?? undefined),
    ...extra,
  });
}

export async function sendTestEmail(to: string, cfg: OrgEmailConfig) {
  const resend = getResend(cfg.resendApiKey);
  if (!resend) throw new Error("No hay API key de Resend configurada");

  const extra: Record<string, string> = {};
  if (cfg.replyTo) extra.replyTo = cfg.replyTo;

  const result = await resend.emails.send({
    from: buildFrom(cfg),
    to,
    subject: "Email de prueba — FitAcademy",
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0C0C0C">¡Configuración correcta! ✅</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px">Este es un email de prueba enviado desde la configuración de integraciones.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #22c55e;border-radius:8px;padding:20px">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:600">✓ El envío de emails está funcionando correctamente</p>
        <p style="margin:8px 0 0;font-size:13px;color:#166534">Remitente: ${buildFrom(cfg)}</p>
      </div>
    `, cfg.fromName ?? undefined),
    ...extra,
  });

  if (result.error) throw new Error(result.error.message);
}

export async function sendInvitationEmail(
  to: string,
  inviteUrl: string,
  orgName: string,
  inviterName: string,
  roleLabel: string,
  cfg?: OrgEmailConfig,
) {
  const resend = getResend(cfg?.resendApiKey);
  if (!resend) return;

  const extra: Record<string, string> = {};
  if (cfg?.replyTo) extra.replyTo = cfg.replyTo;

  await resend.emails.send({
    from: buildFrom(cfg),
    to,
    subject: `${inviterName} te invita a unirte a ${orgName} en FitAcademy`,
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;font-size:22px;color:#0C0C0C">Tienes una invitación 🎉</h2>
      <p style="margin:0 0 20px;color:#6b7280;font-size:15px">
        <strong>${inviterName}</strong> te ha invitado a unirte a <strong>${orgName}</strong>
        en FitAcademy como <strong>${roleLabel}</strong>.
      </p>
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-left:4px solid #FCE900;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#374151">Con FitAcademy podrás:</p>
        <ul style="margin:10px 0 0;padding-left:20px;color:#6b7280;font-size:13px;line-height:1.8">
          <li>Acceder a tus cursos de formación profesional</li>
          <li>Seguir tu progreso y obtener certificados</li>
          <li>Participar en clases en directo</li>
        </ul>
      </div>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#FCE900;color:#0C0C0C;font-weight:700;font-size:15px;
                padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.3px">
        Activar mi cuenta →
      </a>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">
        Este enlace caduca en 7 días. Si no esperabas esta invitación, ignora este email.
      </p>
    `, orgName),
    ...extra,
  });
}

/* ── INFORME DE CUMPLIMIENTO ─────────────────────────────────────────────── */

export interface ComplianceReportData {
  orgName:       string;
  period:        string;               // "Semana del 2 jun" / "Junio 2026"
  totalEmployees: number;
  compliancePct:  number;
  overdueCount:   number;
  atRiskCount:    number;              // deadline ≤ 3 días
  departments: {
    name:          string;
    total:         number;
    completed:     number;
    pct:           number;
  }[];
  atRisk: { name: string; course: string; daysLeft: number }[];
  overdue: { name: string; course: string; daysAgo: number }[];
  dashboardUrl:  string;
}

export async function sendComplianceReportEmail(
  to:   string,
  data: ComplianceReportData,
  cfg?: OrgEmailConfig,
) {
  const resend = getResend(cfg?.resendApiKey);
  if (!resend) return;

  const extra: Record<string, string> = {};
  if (cfg?.replyTo) extra.replyTo = cfg.replyTo;

  const statusColor = data.compliancePct >= 80 ? "#22c55e" : data.compliancePct >= 50 ? "#f59e0b" : "#ef4444";

  const deptRows = data.departments.map(d => `
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6">${d.name}</td>
      <td style="padding:10px 16px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center">${d.total}</td>
      <td style="padding:10px 16px;font-size:13px;border-bottom:1px solid #f3f4f6;text-align:center">
        <span style="color:${d.pct >= 80 ? "#16a34a" : d.pct >= 50 ? "#d97706" : "#dc2626"};font-weight:700">${d.pct}%</span>
      </td>
    </tr>
  `).join("");

  const atRiskRows = data.atRisk.slice(0, 5).map(r => `
    <li style="font-size:13px;color:#374151;padding:4px 0;border-bottom:1px solid #fef9c3">
      <strong>${r.name}</strong> — ${r.course}
      <span style="color:#d97706;font-weight:600;margin-left:8px">⏰ ${r.daysLeft}d restantes</span>
    </li>
  `).join("");

  const overdueRows = data.overdue.slice(0, 5).map(r => `
    <li style="font-size:13px;color:#374151;padding:4px 0;border-bottom:1px solid #fee2e2">
      <strong>${r.name}</strong> — ${r.course}
      <span style="color:#dc2626;font-weight:600;margin-left:8px">Venció hace ${r.daysAgo}d</span>
    </li>
  `).join("");

  await resend.emails.send({
    from:    buildFrom(cfg),
    to,
    subject: `📊 Informe semanal de formación — ${data.orgName}`,
    html: baseTemplate(`
      <h2 style="margin:0 0 4px;font-size:20px;color:#0C0C0C">Informe de cumplimiento</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#6b7280">${data.period} · ${data.orgName}</p>

      <!-- KPIs -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
        <tr>
          ${[
            { label: "Empleados", value: data.totalEmployees, color: "#374151" },
            { label: "Cumplimiento", value: `${data.compliancePct}%`, color: statusColor },
            { label: "Vencidos", value: data.overdueCount, color: data.overdueCount > 0 ? "#dc2626" : "#16a34a" },
            { label: "En riesgo", value: data.atRiskCount, color: data.atRiskCount > 0 ? "#d97706" : "#16a34a" },
          ].map(k => `
            <td style="text-align:center;padding:16px 8px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">
              <div style="font-size:26px;font-weight:900;color:${k.color}">${k.value}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:4px">${k.label}</div>
            </td>
          `).join('<td style="width:8px"></td>')}
        </tr>
      </table>

      <!-- Departamentos -->
      <h3 style="margin:0 0 12px;font-size:14px;color:#0C0C0C;font-weight:700">Por departamento</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:10px 16px;font-size:11px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Departamento</th>
            <th style="padding:10px 16px;font-size:11px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Empleados</th>
            <th style="padding:10px 16px;font-size:11px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Cumplimiento</th>
          </tr>
        </thead>
        <tbody>${deptRows}</tbody>
      </table>

      ${data.atRisk.length > 0 ? `
        <h3 style="margin:0 0 10px;font-size:14px;color:#0C0C0C;font-weight:700">⚠ En riesgo (vence pronto)</h3>
        <ul style="margin:0 0 20px;padding:0 0 0 0;list-style:none;background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:12px 16px">
          ${atRiskRows}
        </ul>
      ` : ""}

      ${data.overdue.length > 0 ? `
        <h3 style="margin:0 0 10px;font-size:14px;color:#0C0C0C;font-weight:700">🔴 Formación vencida</h3>
        <ul style="margin:0 0 20px;padding:0;list-style:none;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px">
          ${overdueRows}
        </ul>
      ` : ""}

      <a href="${data.dashboardUrl}"
         style="display:inline-block;background:#FCE900;color:#0C0C0C;font-weight:700;font-size:14px;
                padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:8px">
        Ver informe completo →
      </a>
    `, data.orgName),
    ...extra,
  });
}
