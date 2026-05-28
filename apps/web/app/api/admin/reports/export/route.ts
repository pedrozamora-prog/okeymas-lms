export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const DEPT_LABELS: Record<string, string> = {
  ADMINISTRACION: "Administración",
  RECEPCION:      "Recepción",
  LIMPIEZA:       "Limpieza",
  MONITOR:        "Monitor",
  DEPORTIVO:      "Deportivo",
};

const STATUS_LABELS: Record<string, string> = {
  ENROLLED:    "Inscrito",
  IN_PROGRESS: "En progreso",
  COMPLETED:   "Completado",
  EXPIRED:     "Vencido",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string; name?: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dept   = searchParams.get("dept") || "";
  const from   = searchParams.get("from") || "";
  const to     = searchParams.get("to")   || "";
  const format_type = searchParams.get("format") || "excel";

  // ── Filtros ──────────────────────────────────────────────────────────────
  const userWhere: Record<string, unknown> = { organizationId: user.organizationId, isActive: true };
  if (dept) userWhere.department = dept;

  const enrollWhere: Record<string, unknown> = {};
  if (from) enrollWhere.gte = new Date(from);
  if (to)   enrollWhere.lte = new Date(to + "T23:59:59");
  const enrolledAtFilter = (from || to) ? { enrolledAt: enrollWhere } : {};

  // ── Datos ────────────────────────────────────────────────────────────────
  const [employees, courses, enrollments] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      select: { id: true, name: true, email: true, department: true, createdAt: true },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    }),
    prisma.course.findMany({
      where: { organizationId: user.organizationId, status: "PUBLISHED" },
      select: { id: true, title: true, isRequired: true },
      orderBy: { title: "asc" },
    }),
    prisma.enrollment.findMany({
      where: {
        user: userWhere,
        ...enrolledAtFilter,
      },
      include: {
        user:   { select: { id: true, name: true, email: true, department: true } },
        course: { select: { id: true, title: true, isRequired: true } },
      },
    }),
  ]);

  const now = new Date();
  const dateLabel = format(now, "dd-MM-yyyy", { locale: es });

  if (format_type === "excel") {
    return generateExcel({ employees, courses, enrollments, now, dateLabel, user });
  } else {
    return generatePDF({ employees, courses, enrollments, now, dateLabel, user });
  }
}

// ── EXCEL ────────────────────────────────────────────────────────────────────

function generateExcel({ employees, courses, enrollments, now, dateLabel, user }: any) {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Cumplimiento por empleado ──
  const enrollMap = new Map(enrollments.map((e: any) => [`${e.userId}:${e.courseId}`, e]));

  const complianceRows = [
    ["INFORME DE CUMPLIMIENTO — OKEYMAS LMS"],
    [`Generado el ${format(now, "d 'de' MMMM 'de' yyyy", { locale: es })} por ${user.name ?? "Admin"}`],
    [],
    ["Empleado", "Email", "Departamento", ...courses.map((c: any) => c.title), "% Completado"],
  ];

  for (const emp of employees) {
    const deptLabel = DEPT_LABELS[emp.department ?? ""] ?? emp.department ?? "—";
    const statuses = courses.map((course: any) => {
      const enroll = enrollMap.get(`${emp.id}:${course.id}`);
      if (!enroll) return "Sin inscribir";
      return STATUS_LABELS[enroll.status] ?? enroll.status;
    });
    const completed = statuses.filter((s: string) => s === "Completado").length;
    const pct = courses.length > 0 ? `${Math.round((completed / courses.length) * 100)}%` : "—";
    complianceRows.push([emp.name, emp.email, deptLabel, ...statuses, pct]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(complianceRows);

  // Ancho de columnas
  ws1["!cols"] = [
    { wch: 25 }, { wch: 30 }, { wch: 18 },
    ...courses.map(() => ({ wch: 20 })),
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Cumplimiento");

  // ── Hoja 2: Detalle de inscripciones ──
  const detailRows = [
    ["Empleado", "Email", "Departamento", "Curso", "Obligatorio", "Estado", "Inscrito", "Completado", "Fecha límite", "Puntuación"],
  ];

  for (const enroll of enrollments) {
    detailRows.push([
      enroll.user.name,
      enroll.user.email,
      DEPT_LABELS[enroll.user.department ?? ""] ?? "—",
      enroll.course.title,
      enroll.course.isRequired ? "Sí" : "No",
      STATUS_LABELS[enroll.status] ?? enroll.status,
      format(new Date(enroll.enrolledAt), "dd/MM/yyyy"),
      enroll.completedAt ? format(new Date(enroll.completedAt), "dd/MM/yyyy") : "—",
      enroll.deadline    ? format(new Date(enroll.deadline),    "dd/MM/yyyy") : "—",
      enroll.score != null ? `${enroll.score}%` : "—",
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
  ws2["!cols"] = [
    { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 35 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Detalle inscripciones");

  // ── Hoja 3: Resumen por departamento ──
  const deptStats: Record<string, { total: number; completed: number; overdue: number }> = {};
  for (const enroll of enrollments) {
    const dept = enroll.user.department ?? "SIN_DEPT";
    if (!deptStats[dept]) deptStats[dept] = { total: 0, completed: 0, overdue: 0 };
    deptStats[dept].total++;
    if (enroll.status === "COMPLETED") deptStats[dept].completed++;
    if (enroll.status === "EXPIRED") deptStats[dept].overdue++;
  }

  const deptRows = [
    ["Departamento", "Total inscripciones", "Completadas", "Vencidas", "Tasa de finalización"],
    ...Object.entries(deptStats).map(([dept, s]) => [
      DEPT_LABELS[dept] ?? dept,
      s.total,
      s.completed,
      s.overdue,
      s.total > 0 ? `${Math.round((s.completed / s.total) * 100)}%` : "—",
    ]),
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(deptRows);
  ws3["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Por departamento");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="informe-cumplimiento-${dateLabel}.xlsx"`,
    },
  });
}

// ── PDF ──────────────────────────────────────────────────────────────────────

async function generatePDF({ employees, courses, enrollments, now, dateLabel, user }: any) {
  const { renderToBuffer, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const { createElement } = await import("react");

  const C = { black: "#0C0C0C", yellow: "#FCE900", white: "#FFFFFF", gray: "#888888", light: "#F5F5F5", border: "#E5E7EB" };

  const styles = StyleSheet.create({
    page:      { backgroundColor: C.white, padding: 40, fontFamily: "Helvetica" },
    header:    { backgroundColor: C.black, padding: 20, marginBottom: 24, borderRadius: 8 },
    h1:        { color: C.white, fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
    h1sub:     { color: C.yellow, fontSize: 9, letterSpacing: 3, marginTop: 2 },
    meta:      { color: C.gray, fontSize: 8, marginBottom: 20 },
    sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.black, marginBottom: 8, marginTop: 16, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4 },
    tableHeader:  { flexDirection: "row", backgroundColor: C.light, padding: "6 8", borderRadius: 4, marginBottom: 2 },
    tableRow:     { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: C.border },
    th:        { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.gray },
    td:        { fontSize: 7, color: C.black },
    statusDone:    { color: "#16a34a" },
    statusOverdue: { color: "#dc2626" },
    statusPending: { color: "#d97706" },
  });

  const enrollMap = new Map(enrollments.map((e: any) => [`${e.userId}:${e.courseId}`, e]));

  // Resumen por departamento
  const deptStats: Record<string, { total: number; completed: number }> = {};
  for (const enroll of enrollments) {
    const dept = enroll.user.department ?? "—";
    if (!deptStats[dept]) deptStats[dept] = { total: 0, completed: 0 };
    deptStats[dept].total++;
    if (enroll.status === "COMPLETED") deptStats[dept].completed++;
  }

  const doc = createElement(Document, {},
    createElement(Page, { size: "A4", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        createElement(Text, { style: styles.h1 }, "OKEYMAS LMS"),
        createElement(Text, { style: styles.h1sub }, "INFORME DE CUMPLIMIENTO"),
      ),
      createElement(Text, { style: styles.meta },
        `Generado el ${format(now, "d 'de' MMMM 'de' yyyy", { locale: es })} · ${employees.length} empleados · ${courses.length} cursos`
      ),

      // Resumen por departamento
      createElement(Text, { style: styles.sectionTitle }, "RESUMEN POR DEPARTAMENTO"),
      createElement(View, { style: styles.tableHeader },
        createElement(Text, { style: [styles.th, { flex: 2 }] }, "DEPARTAMENTO"),
        createElement(Text, { style: [styles.th, { flex: 1 }] }, "INSCRITOS"),
        createElement(Text, { style: [styles.th, { flex: 1 }] }, "COMPLETADOS"),
        createElement(Text, { style: [styles.th, { flex: 1 }] }, "TASA"),
      ),
      ...Object.entries(deptStats).map(([dept, s]) =>
        createElement(View, { style: styles.tableRow, key: dept },
          createElement(Text, { style: [styles.td, { flex: 2 }] }, DEPT_LABELS[dept] ?? dept),
          createElement(Text, { style: [styles.td, { flex: 1 }] }, String(s.total)),
          createElement(Text, { style: [styles.td, { flex: 1 }] }, String(s.completed)),
          createElement(Text, { style: [styles.td, { flex: 1 }, s.total > 0 && Math.round((s.completed / s.total) * 100) >= 80 ? styles.statusDone : styles.statusPending] },
            s.total > 0 ? `${Math.round((s.completed / s.total) * 100)}%` : "—"
          ),
        )
      ),

      // Detalle empleados
      createElement(Text, { style: styles.sectionTitle }, "DETALLE POR EMPLEADO"),
      createElement(View, { style: styles.tableHeader },
        createElement(Text, { style: [styles.th, { flex: 2 }] }, "EMPLEADO"),
        createElement(Text, { style: [styles.th, { flex: 1.5 }] }, "DEPARTAMENTO"),
        createElement(Text, { style: [styles.th, { flex: 2 }] }, "CURSO"),
        createElement(Text, { style: [styles.th, { flex: 1 }] }, "ESTADO"),
        createElement(Text, { style: [styles.th, { flex: 1 }] }, "FECHA"),
      ),
      ...enrollments.slice(0, 40).map((enroll: any, i: number) => {
        const statusStyle =
          enroll.status === "COMPLETED" ? styles.statusDone :
          enroll.status === "EXPIRED"   ? styles.statusOverdue : styles.statusPending;
        return createElement(View, { style: styles.tableRow, key: i },
          createElement(Text, { style: [styles.td, { flex: 2 }] }, enroll.user.name),
          createElement(Text, { style: [styles.td, { flex: 1.5 }] }, DEPT_LABELS[enroll.user.department ?? ""] ?? "—"),
          createElement(Text, { style: [styles.td, { flex: 2 }] }, enroll.course.title),
          createElement(Text, { style: [styles.td, { flex: 1 }, statusStyle] }, STATUS_LABELS[enroll.status] ?? enroll.status),
          createElement(Text, { style: [styles.td, { flex: 1 }] },
            enroll.completedAt ? format(new Date(enroll.completedAt), "dd/MM/yy") : "—"
          ),
        );
      }),
    )
  ) as any;

  const buf = await renderToBuffer(doc);

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="informe-cumplimiento-${dateLabel}.pdf"`,
    },
  });
}
