export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendComplianceReportEmail, ComplianceReportData, OrgEmailConfig } from "@/lib/email";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Vercel Cron llama a esta ruta cada día a las 7:00 AM
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now     = new Date();
  const weekday = now.getDay() === 0 ? 7 : now.getDay(); // 1=lunes … 7=domingo
  const dayOfMonth = now.getDate();

  // Orgs con informes activos
  const orgs = await prisma.organization.findMany({
    where: { reportFrequency: { not: "DISABLED" }, isActive: true },
    select: {
      id: true, name: true,
      reportFrequency: true, reportDayOfWeek: true, reportDayOfMonth: true, reportLastSentAt: true,
      emailFromName: true, emailFromAddress: true, emailReplyTo: true, resendApiKey: true,
    },
  });

  let sent = 0;

  for (const org of orgs) {
    // ¿Toca enviar hoy?
    const isDue = org.reportFrequency === "WEEKLY"
      ? weekday === org.reportDayOfWeek
      : dayOfMonth === org.reportDayOfMonth;

    if (!isDue) continue;

    // Anti-duplicado: no enviar si ya se envió hoy
    if (org.reportLastSentAt) {
      const lastSent  = new Date(org.reportLastSentAt);
      const sameDay   = lastSent.toDateString() === now.toDateString();
      if (sameDay) continue;
    }

    // Recopilar datos
    const [employees, requiredCourses] = await Promise.all([
      prisma.user.findMany({
        where:   { organizationId: org.id, isActive: true, role: "EMPLOYEE" },
        select:  { id: true, name: true, department: { select: { name: true } } },
      }),
      prisma.course.findMany({
        where:   { organizationId: org.id, isRequired: true, status: "PUBLISHED" },
        select:  { id: true, title: true },
      }),
    ]);

    if (employees.length === 0) continue;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId:   { in: employees.map(e => e.id) },
        courseId: { in: requiredCourses.map(c => c.id) },
      },
      select: { userId: true, courseId: true, status: true, deadline: true },
    });

    // Stats globales
    const totalRequired = employees.length * requiredCourses.length;
    const totalCompleted = enrollments.filter(e => e.status === "COMPLETED").length;
    const compliancePct  = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 100;

    const overdueList = enrollments.filter(
      e => e.status !== "COMPLETED" && e.deadline && new Date(e.deadline) < now
    );
    const atRiskList = enrollments.filter(e => {
      if (e.status === "COMPLETED" || !e.deadline) return false;
      const dl = new Date(e.deadline);
      const days = Math.ceil((dl.getTime() - now.getTime()) / 86400000);
      return days >= 0 && days <= 3;
    });

    // Por departamento
    const deptMap: Record<string, { total: number; completed: number }> = {};
    for (const emp of employees) {
      const deptName = emp.department?.name ?? "Sin departamento";
      if (!deptMap[deptName]) deptMap[deptName] = { total: 0, completed: 0 };
      deptMap[deptName].total++;
    }
    for (const enroll of enrollments) {
      if (enroll.status !== "COMPLETED") continue;
      const emp = employees.find(e => e.id === enroll.userId);
      const deptName = emp?.department?.name ?? "Sin departamento";
      if (deptMap[deptName]) deptMap[deptName].completed++;
    }
    const departments = Object.entries(deptMap).map(([name, s]) => ({
      name,
      total:     s.total,
      completed: s.completed,
      pct:       s.total > 0 ? Math.round((s.completed / (s.total * requiredCourses.length)) * 100) : 100,
    })).filter(d => d.total > 0);

    // En riesgo con nombre
    const empMap = new Map(employees.map(e => [e.id, e.name]));
    const courseMap = new Map(requiredCourses.map(c => [c.id, c.title]));

    const atRisk = atRiskList.map(e => ({
      name:     empMap.get(e.userId) ?? "–",
      course:   courseMap.get(e.courseId) ?? "–",
      daysLeft: Math.ceil((new Date(e.deadline!).getTime() - now.getTime()) / 86400000),
    })).sort((a, b) => a.daysLeft - b.daysLeft);

    const overdue = overdueList.map(e => ({
      name:    empMap.get(e.userId) ?? "–",
      course:  courseMap.get(e.courseId) ?? "–",
      daysAgo: Math.abs(Math.ceil((new Date(e.deadline!).getTime() - now.getTime()) / 86400000)),
    })).sort((a, b) => b.daysAgo - a.daysAgo);

    // Destinatarios: todos los admins y managers de la org
    const recipients = await prisma.user.findMany({
      where: { organizationId: org.id, isActive: true, role: { in: ["SUPER_ADMIN", "BRANCH_ADMIN", "MANAGER"] } },
      select: { email: true },
    });

    if (recipients.length === 0) continue;

    const period = org.reportFrequency === "WEEKLY"
      ? `Semana del ${format(now, "d 'de' MMMM", { locale: es })}`
      : format(now, "MMMM yyyy", { locale: es });

    const reportData: ComplianceReportData = {
      orgName:        org.name,
      period,
      totalEmployees: employees.length,
      compliancePct,
      overdueCount:   overdueList.length,
      atRiskCount:    atRiskList.length,
      departments,
      atRisk,
      overdue,
      dashboardUrl:   `${process.env.NEXTAUTH_URL ?? "https://app.Formia.com"}/admin/compliance`,
    };

    const emailCfg: OrgEmailConfig = {
      fromName:    org.emailFromName,
      fromAddress: org.emailFromAddress,
      replyTo:     org.emailReplyTo,
      resendApiKey: org.resendApiKey,
    };

    // Enviar a todos los destinatarios
    await Promise.allSettled(
      recipients.map(r => sendComplianceReportEmail(r.email, reportData, emailCfg))
    );

    // Actualizar lastSentAt
    await prisma.organization.update({
      where: { id: org.id },
      data:  { reportLastSentAt: now },
    });

    sent++;
  }

  return NextResponse.json({ ok: true, reportsSent: sent });
}
