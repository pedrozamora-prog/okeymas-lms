import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

type PrlStatus = "ok" | "warning" | "expired" | "missing";

function getStatus(expiresAt: Date | null | undefined): PrlStatus {
  if (!expiresAt) return "ok";
  const now = new Date();
  if (expiresAt < now) return "expired";
  if (differenceInDays(expiresAt, now) <= 30) return "warning";
  return "ok";
}

const STATUS_LABELS: Record<PrlStatus, string> = {
  ok:      "✓ En regla",
  warning: "⚠ Vence pronto",
  expired: "✗ Vencido",
  missing: "— Sin realizar",
};

export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [org, prlCourses, employees] = await Promise.all([
    prisma.organization.findUnique({ where: { id: user.organizationId }, select: { name: true } }),
    prisma.course.findMany({
      where: { organizationId: user.organizationId, isPrl: true, status: "PUBLISHED" },
      select: { id: true, title: true, prlRiskLevel: true, certificateValidityDays: true },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId, isActive: true },
      select: { id: true, name: true, email: true, department: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const certificates = prlCourses.length > 0 ? await prisma.certificate.findMany({
    where: {
      courseId: { in: prlCourses.map(c => c.id) },
      userId:   { in: employees.map(e => e.id) },
    },
    select: { userId: true, courseId: true, issuedAt: true, expiresAt: true },
    orderBy: { issuedAt: "desc" },
  }) : [];

  const certMap = new Map<string, { issuedAt: Date; expiresAt: Date | null }>();
  for (const c of certificates) {
    const key = `${c.userId}:${c.courseId}`;
    if (!certMap.has(key)) certMap.set(key, { issuedAt: c.issuedAt, expiresAt: c.expiresAt });
  }

  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  const rows = employees.map(emp => {
    return prlCourses.map(course => {
      const cert = certMap.get(`${emp.id}:${course.id}`);
      const status: PrlStatus = cert ? getStatus(cert.expiresAt) : "missing";
      return {
        employeeName: emp.name,
        employeeEmail: emp.email,
        department: emp.department?.name ?? "—",
        course: course.title,
        status: STATUS_LABELS[status],
        issuedAt: cert ? format(cert.issuedAt, "dd/MM/yyyy", { locale: es }) : "—",
        expiresAt: cert?.expiresAt ? format(cert.expiresAt, "dd/MM/yyyy", { locale: es }) : "—",
      };
    });
  }).flat();

  const tableRows = rows.map(r => `
    <tr>
      <td>${r.employeeName}</td>
      <td style="color:#666;font-size:11px">${r.employeeEmail}</td>
      <td>${r.department}</td>
      <td>${r.course}</td>
      <td style="font-weight:700;color:${r.status.startsWith("✓") ? "#16a34a" : r.status.startsWith("⚠") ? "#ca8a04" : r.status.startsWith("✗") ? "#dc2626" : "#6b7280"}">${r.status}</td>
      <td>${r.issuedAt}</td>
      <td>${r.expiresAt}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Acta PRL — ${org?.name}</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; padding: 40px; font-size: 13px; }
  h1 { font-size: 22px; font-weight: 900; color: #0C0C0C; margin-bottom: 4px; }
  .subtitle { color: #666; margin-bottom: 32px; font-size: 13px; }
  .meta { display: flex; justify-content: space-between; padding: 16px 20px; background: #f8f8f8; border-radius: 8px; margin-bottom: 32px; font-size: 12px; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #0C0C0C; color: #fff; padding: 10px 12px; text-align: left; font-weight: 700; }
  td { padding: 9px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) td { background: #fafafa; }
  .legal { margin-top: 32px; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; font-size: 11px; color: #555; line-height: 1.6; }
  .firma { margin-top: 48px; display: flex; gap: 80px; }
  .firma-col { flex: 1; border-top: 1px solid #111; padding-top: 8px; font-size: 11px; color: #555; }
</style>
</head>
<body>
  <h1>Acta de Cumplimiento PRL</h1>
  <p class="subtitle">Prevención de Riesgos Laborales · Ley 31/1995 LPRL</p>

  <div class="meta">
    <span><strong>Organización:</strong> ${org?.name ?? "—"}</span>
    <span><strong>Fecha de emisión:</strong> ${today}</span>
    <span><strong>Total empleados:</strong> ${employees.length}</span>
    <span><strong>Cursos PRL:</strong> ${prlCourses.length}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Empleado</th>
        <th>Email</th>
        <th>Departamento</th>
        <th>Formación PRL</th>
        <th>Estado</th>
        <th>Fecha realización</th>
        <th>Válido hasta</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="legal">
    <strong>Nota legal:</strong> Este documento acredita el estado de formación en Prevención de Riesgos Laborales de los empleados de la organización,
    de conformidad con lo establecido en la Ley 31/1995 de 8 de noviembre de Prevención de Riesgos Laborales y el
    Real Decreto 39/1997 por el que se aprueba el Reglamento de los Servicios de Prevención.
    Los empleados con estado "Vencido" o "Sin realizar" requieren formación inmediata para evitar responsabilidades
    sancionadoras conforme al art. 40 del texto refundido de la Ley sobre Infracciones y Sanciones en el Orden Social (LISOS).
  </div>

  <div class="firma">
    <div class="firma-col">Responsable de formación</div>
    <div class="firma-col">Representante de la empresa</div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="acta-prl-${format(new Date(), "yyyy-MM-dd")}.html"`,
    },
  });
}
