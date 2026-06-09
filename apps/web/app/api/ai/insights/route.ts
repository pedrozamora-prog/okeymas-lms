import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string; organizationId?: string } | undefined;

    if (!user?.id || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role ?? "")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orgId = user.organizationId!;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalCourses,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      overdueEnrollments,
      newEnrollmentsLast30d,
      completionsLast30d,
      coursesWithStats,
      quizAttempts,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId, isActive: true } }),

      prisma.user.count({
        where: {
          organizationId: orgId,
          isActive: true,
          progress: { some: { updatedAt: { gte: sevenDaysAgo } } },
        },
      }),

      prisma.course.count({ where: { organizationId: orgId, status: "PUBLISHED" } }),

      prisma.enrollment.count({ where: { user: { organizationId: orgId } } }),

      prisma.enrollment.count({ where: { user: { organizationId: orgId }, status: "COMPLETED" } }),

      prisma.enrollment.count({ where: { user: { organizationId: orgId }, status: "IN_PROGRESS" } }),

      prisma.enrollment.count({
        where: {
          user: { organizationId: orgId },
          status: { in: ["ENROLLED", "IN_PROGRESS"] },
          deadline: { lt: new Date() },
        },
      }),

      prisma.enrollment.count({
        where: {
          user: { organizationId: orgId },
          enrolledAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.enrollment.count({
        where: {
          user: { organizationId: orgId },
          status: "COMPLETED",
          completedAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.course.findMany({
        where: { organizationId: orgId, status: "PUBLISHED" },
        include: {
          _count: { select: { enrollments: true } },
          enrollments: {
            select: { status: true },
            where: { user: { organizationId: orgId } },
          },
        },
        take: 10,
      }),

      prisma.quizAttempt.findMany({
        where: { quiz: { lesson: { module: { course: { organizationId: orgId } } } } },
        select: { passed: true, score: true },
        take: 200,
      }),

      prisma.lessonProgress.count({
        where: {
          user: { organizationId: orgId },
          updatedAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    // Simulation stats — optional, only if Prisma client has been regenerated
    let simulationStats: { score: number | null }[] = [];
    try {
      simulationStats = await (prisma as any).simulationAttempt.findMany({
        where: { user: { organizationId: orgId }, completedAt: { not: null } },
        select: { score: true },
        take: 100,
      });
    } catch {
      // Prisma client not yet regenerated — skip simulation data
    }

    // Derive course-level stats
    const courseStats = coursesWithStats.map((c) => {
      const total     = c.enrollments.length;
      const completed = c.enrollments.filter((e) => e.status === "COMPLETED").length;
      return {
        title:          c.title,
        enrollments:    total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    const quizPassRate = quizAttempts.length > 0
      ? Math.round((quizAttempts.filter((a) => a.passed).length / quizAttempts.length) * 100)
      : null;

    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length)
      : null;

    const avgSimScore = simulationStats.length > 0
      ? Math.round(simulationStats.reduce((s, a) => s + (a.score ?? 0), 0) / simulationStats.length)
      : null;

    const worstCourse = courseStats
      .filter((c) => c.enrollments >= 3)
      .sort((a, b) => a.completionRate - b.completionRate)[0] ?? null;

    const bestCourse = courseStats
      .filter((c) => c.enrollments >= 3)
      .sort((a, b) => b.completionRate - a.completionRate)[0] ?? null;

    const engagementRate = totalUsers > 0
      ? Math.round((activeUsers / totalUsers) * 100)
      : 0;

    const statsContext = `
ESTADÍSTICAS DE LA PLATAFORMA LMS (últimos 30 días):

Usuarios:
- Total usuarios activos: ${totalUsers}
- Usuarios activos esta semana (con actividad): ${activeUsers} (${engagementRate}% engagement)
- Actividad de lecciones últimos 7 días: ${recentActivity} progresos registrados

Cursos y formación:
- Cursos publicados: ${totalCourses}
- Total inscripciones: ${totalEnrollments}
- Inscripciones completadas: ${completedEnrollments} (${completionRate}% tasa global)
- En progreso: ${inProgressEnrollments}
- Vencidas/expiradas sin completar: ${overdueEnrollments}
- Nuevas inscripciones últimos 30 días: ${newEnrollmentsLast30d}
- Completadas últimos 30 días: ${completionsLast30d}

Evaluaciones (Quiz):
- Total intentos analizados: ${quizAttempts.length}
${quizPassRate !== null ? `- Tasa de aprobación: ${quizPassRate}%` : "- Sin datos de quiz aún"}
${avgQuizScore !== null ? `- Puntuación media: ${avgQuizScore}/100` : ""}

Simulador de conversaciones IA:
${avgSimScore !== null ? `- Simulaciones completadas: ${simulationStats.length}\n- Puntuación media empleados: ${avgSimScore}/100` : "- Sin simulaciones completadas aún"}

Cursos destacados (de ${courseStats.length} analizados):
${bestCourse  ? `- Mejor tasa de completado: "${bestCourse.title}" (${bestCourse.completionRate}% de ${bestCourse.enrollments} inscritos)`   : ""}
${worstCourse ? `- Menor tasa de completado: "${worstCourse.title}" (${worstCourse.completionRate}% de ${worstCourse.enrollments} inscritos)` : ""}
`.trim();

    const prompt = `Eres un analista experto en formación corporativa y LMS para gimnasios y empresas fitness.

${statsContext}

Analiza estos datos y genera exactamente 5 insights accionables para el administrador de la plataforma.

IMPORTANTE: Devuelve ÚNICAMENTE un JSON array. Sin texto adicional. Sin markdown. Sin bloques de código.

Formato exacto:
[
  {
    "urgency": "alta|media|baja",
    "category": "engagement|completado|evaluacion|riesgo|logro",
    "title": "Título corto del insight (máx 8 palabras)",
    "body": "Análisis concreto basado en los datos. Menciona cifras específicas. 2-3 frases.",
    "action": "Acción recomendada concreta para el admin (1 frase)"
  }
]

Prioriza: riesgos de compliance (cursos vencidos), engagement bajo, áreas de mejora en evaluaciones, y logros positivos. Sé específico con los números.`;

    const model  = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const raw    = result.response.text();

    let insights: unknown[] = [];
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      insights = JSON.parse(match[0]);
    }

    return NextResponse.json({ insights, generatedAt: new Date().toISOString() });

  } catch (err) {
    console.error("[insights]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}
