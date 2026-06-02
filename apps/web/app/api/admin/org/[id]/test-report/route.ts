import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendComplianceReportEmail, ComplianceReportData, OrgEmailConfig } from "@/lib/email";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DEPT_LABELS: Record<string, string> = {
  ADMINISTRACION: "Administración",
  RECEPCION:      "Recepción",
  LIMPIEZA:       "Limpieza",
  MONITOR:        "Monitor",
  DEPORTIVO:      "Deportivo",
};

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string; email?: string } | undefined;
  const { id } = await params;

  if (!user || user.role !== "SUPER_ADMIN" || id !== user.organizationId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const now = new Date();

  const [org, employees, requiredCourses] = await Promise.all([
    prisma.organization.findUnique({
      where:  { id },
      select: { name: true, emailFromName: true, emailFromAddress: true, emailReplyTo: true, resendApiKey: true },
    }),
    prisma.user.findMany({
      where:  { organizationId: id, isActive: true, role: "EMPLOYEE" },
      select: { id: true, name: true, department: true },
    }),
    prisma.course.findMany({
      where:  { organizationId: id, isRequired: true, status: "PUBLISHED" },
      select: { id: true, title: true },
    }),
  ]);

  if (!org) return NextResponse.json({ error: "Org no encontrada" }, { status: 404 });
  if (!user.email) return NextResponse.json({ error: "No hay email de destino" }, { status: 400 });

  const enrollments = employees.length > 0 && requiredCourses.length > 0
    ? await prisma.enrollment.findMany({
        where: { userId: { in: employees.map(e => e.id) }, courseId: { in: requiredCourses.map(c => c.id) } },
        select: { userId: true, courseId: true, status: true, deadline: true },
      })
    : [];

  const totalRequired  = employees.length * requiredCourses.length;
  const totalCompleted = enrollments.filter(e => e.status === "COMPLETED").length;
  const compliancePct  = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 100;
  const empMap    = new Map(employees.map(e => [e.id, e.name]));
  const courseMap = new Map(requiredCourses.map(c => [c.id, c.title]));

  const departments = Object.entries(DEPT_LABELS).map(([key, label]) => {
    const deptEmps    = employees.filter(e => e.department === key);
    const deptEnrolls = enrollments.filter(e => deptEmps.some(emp => emp.id === e.userId));
    const deptDone    = deptEnrolls.filter(e => e.status === "COMPLETED").length;
    const deptTotal   = deptEmps.length * requiredCourses.length;
    return { name: label, total: deptEmps.length, completed: deptDone, pct: deptTotal > 0 ? Math.round((deptDone / deptTotal) * 100) : 100 };
  }).filter(d => d.total > 0);

  const atRisk = enrollments
    .filter(e => { if (e.status === "COMPLETED" || !e.deadline) return false; const d = Math.ceil((new Date(e.deadline).getTime() - now.getTime()) / 86400000); return d >= 0 && d <= 3; })
    .map(e => ({ name: empMap.get(e.userId) ?? "–", course: courseMap.get(e.courseId) ?? "–", daysLeft: Math.ceil((new Date(e.deadline!).getTime() - now.getTime()) / 86400000) }));

  const overdue = enrollments
    .filter(e => e.status !== "COMPLETED" && e.deadline && new Date(e.deadline) < now)
    .map(e => ({ name: empMap.get(e.userId) ?? "–", course: courseMap.get(e.courseId) ?? "–", daysAgo: Math.abs(Math.ceil((new Date(e.deadline!).getTime() - now.getTime()) / 86400000)) }));

  const reportData: ComplianceReportData = {
    orgName: org.name,
    period:  `Prueba — ${format(now, "d 'de' MMMM yyyy", { locale: es })}`,
    totalEmployees: employees.length,
    compliancePct,
    overdueCount: overdue.length,
    atRiskCount:  atRisk.length,
    departments,
    atRisk,
    overdue,
    dashboardUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/admin/compliance`,
  };

  const cfg: OrgEmailConfig = { fromName: org.emailFromName, fromAddress: org.emailFromAddress, replyTo: org.emailReplyTo, resendApiKey: org.resendApiKey };

  try {
    await sendComplianceReportEmail(user.email, reportData, cfg);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
