import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "WATCH";

export interface EmployeeAlert {
  userId:       string;
  userName:     string;
  userEmail:    string;
  department:   string | null;
  courseId:     string;
  courseTitle:  string;
  enrollmentId: string;
  status:       string;
  progressPct:  number;
  daysLeft:     number | null;
  lastActivity: string | null;    // ISO date
  riskLevel:    RiskLevel;
  riskReason:   string;
}

function calcRisk(
  status: string,
  daysLeft: number | null,
  progressPct: number,
  daysSinceActivity: number | null,
): { level: RiskLevel; reason: string } {

  if (status === "EXPIRED") {
    return { level: "CRITICAL", reason: "Formación vencida — plazo superado" };
  }
  if (daysLeft !== null && daysLeft <= 3 && progressPct < 100) {
    return { level: "CRITICAL", reason: `Vence en ${daysLeft}d y progreso al ${progressPct}%` };
  }
  if (daysLeft !== null && daysLeft <= 7 && progressPct < 50) {
    return { level: "HIGH", reason: `Vence en ${daysLeft}d con solo ${progressPct}% completado` };
  }
  if (daysLeft !== null && daysLeft <= 14 && progressPct < 30) {
    return { level: "HIGH", reason: `Poco avance (${progressPct}%) a ${daysLeft}d del plazo` };
  }
  if (daysSinceActivity !== null && daysSinceActivity >= 14 && (daysLeft === null || daysLeft <= 30)) {
    return { level: "MEDIUM", reason: `Sin actividad hace ${daysSinceActivity}d` };
  }
  if (daysSinceActivity !== null && daysSinceActivity >= 7 && daysLeft !== null && daysLeft <= 21) {
    return { level: "MEDIUM", reason: `Sin actividad hace ${daysSinceActivity}d con ${daysLeft}d restantes` };
  }
  if (daysSinceActivity !== null && daysSinceActivity >= 14) {
    return { level: "WATCH", reason: `Sin actividad hace ${daysSinceActivity}d` };
  }
  if (progressPct === 0 && daysLeft !== null && daysLeft <= 21) {
    return { level: "WATCH", reason: `No ha empezado — ${daysLeft}d restantes` };
  }

  return { level: "WATCH", reason: "Sin actividad reciente" };
}

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const url      = new URL(req.url);
  const minLevel = (url.searchParams.get("minLevel") ?? "WATCH") as RiskLevel;

  const now = new Date();

  // Obtener todos los empleados activos con sus inscripciones en cursos requeridos
  const employees = await prisma.user.findMany({
    where: { organizationId: user.organizationId, isActive: true, role: "EMPLOYEE" },
    select: { id: true, name: true, email: true, department: true },
  });

  const requiredCourses = await prisma.course.findMany({
    where:  { organizationId: user.organizationId, isRequired: true, status: "PUBLISHED" },
    select: { id: true, title: true, modules: { select: { lessons: { select: { id: true } } } } },
  });

  if (employees.length === 0 || requiredCourses.length === 0) {
    return NextResponse.json({ alerts: [], counts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, WATCH: 0 } });
  }

  const allLessonIds = requiredCourses.flatMap(c => c.modules.flatMap(m => m.lessons.map(l => l.id)));

  const [enrollments, lessonProgress] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        userId:   { in: employees.map(e => e.id) },
        courseId: { in: requiredCourses.map(c => c.id) },
      },
      select: { id: true, userId: true, courseId: true, status: true, deadline: true },
    }),
    prisma.lessonProgress.findMany({
      where: {
        userId:   { in: employees.map(e => e.id) },
        lessonId: { in: allLessonIds },
        completed: true,
      },
      select: { userId: true, lessonId: true, completedAt: true },
    }),
  ]);

  // Map helpers
  const empMap    = new Map(employees.map(e => [e.id, e]));
  const courseMap = new Map(requiredCourses.map(c => [c.id, c]));

  // Lecciones por curso
  const courseLessons = new Map(
    requiredCourses.map(c => [c.id, c.modules.flatMap(m => m.lessons.map(l => l.id))])
  );

  // Progreso por usuario+curso
  const progressByUserCourse = new Map<string, { count: number; lastDate: Date | null }>();
  for (const lp of lessonProgress) {
    const course = requiredCourses.find(c =>
      c.modules.some(m => m.lessons.some(l => l.id === lp.lessonId))
    );
    if (!course) continue;
    const key  = `${lp.userId}:${course.id}`;
    const curr = progressByUserCourse.get(key) ?? { count: 0, lastDate: null };
    curr.count++;
    if (lp.completedAt && (!curr.lastDate || lp.completedAt > curr.lastDate)) {
      curr.lastDate = lp.completedAt;
    }
    progressByUserCourse.set(key, curr);
  }

  const LEVEL_ORDER: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WATCH: 3 };
  const MIN_ORDER = LEVEL_ORDER[minLevel];

  const alerts: EmployeeAlert[] = [];

  for (const enrollment of enrollments) {
    if (enrollment.status === "COMPLETED") continue;

    const emp    = empMap.get(enrollment.userId);
    const course = courseMap.get(enrollment.courseId);
    if (!emp || !course) continue;

    const totalLessons  = courseLessons.get(course.id)?.length ?? 0;
    const prog          = progressByUserCourse.get(`${enrollment.userId}:${course.id}`);
    const progressPct   = totalLessons > 0 ? Math.round(((prog?.count ?? 0) / totalLessons) * 100) : 0;
    const daysLeft      = enrollment.deadline
      ? Math.ceil((enrollment.deadline.getTime() - now.getTime()) / 86400000)
      : null;
    const daysSinceActivity = prog?.lastDate
      ? Math.floor((now.getTime() - prog.lastDate.getTime()) / 86400000)
      : null;

    const { level, reason } = calcRisk(enrollment.status, daysLeft, progressPct, daysSinceActivity);

    if (LEVEL_ORDER[level] > MIN_ORDER) continue;

    alerts.push({
      userId:       emp.id,
      userName:     emp.name,
      userEmail:    emp.email,
      department:   emp.department,
      courseId:     course.id,
      courseTitle:  course.title,
      enrollmentId: enrollment.id,
      status:       enrollment.status,
      progressPct,
      daysLeft,
      lastActivity: prog?.lastDate?.toISOString() ?? null,
      riskLevel:    level,
      riskReason:   reason,
    });
  }

  // Ordenar: CRITICAL primero, luego por daysLeft ascendente
  alerts.sort((a, b) => {
    const lvl = LEVEL_ORDER[a.riskLevel] - LEVEL_ORDER[b.riskLevel];
    if (lvl !== 0) return lvl;
    return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
  });

  const counts = {
    CRITICAL: alerts.filter(a => a.riskLevel === "CRITICAL").length,
    HIGH:     alerts.filter(a => a.riskLevel === "HIGH").length,
    MEDIUM:   alerts.filter(a => a.riskLevel === "MEDIUM").length,
    WATCH:    alerts.filter(a => a.riskLevel === "WATCH").length,
  };

  return NextResponse.json({ alerts, counts });
}
