import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CoursesCatalog } from "@/components/courses/courses-catalog";
import { getServerT } from "@/lib/server-t";

export const metadata = { title: "Mis Cursos" };

export default async function CoursesPage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId: string; role: string; department?: string };
  const t = await getServerT();

  const isEmployee = user.role === "EMPLOYEE";

  const [courses, enrollments, ratingRows] = await Promise.all([
    prisma.course.findMany({
      where: {
        organizationId: user.organizationId,
        status: "PUBLISHED",
        ...(isEmployee && user.department ? {
          OR: [
            { departments: { none: {} } },
            { departments: { some: { id: user.department } } },
          ],
        } : {}),
      },
      select: {
        id: true, title: true, description: true, thumbnailUrl: true,
        isRequired: true, departments: { select: { id: true, name: true } },
        modules: { include: { lessons: { select: { id: true } } } },
        _count: { select: { enrollments: true } },
      },
      orderBy: [{ isRequired: "desc" }, { order: "asc" }],
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: { modules: { include: { lessons: { select: { id: true } } } } },
        },
      },
    }),
  ]);

  const progressMap = await buildProgressMap(user.id, enrollments);

  let ratingMap: Record<string, { avg: number | null; count: number }> = {};
  try {
    const ratingRows = await prisma.$queryRaw<{ courseId: string; avg: number | null; count: bigint }[]>`
      SELECT "courseId",
             AVG(rating)::FLOAT AS avg,
             COUNT(*) FILTER (WHERE rating IS NOT NULL) AS count
      FROM   enrollments
      WHERE  "courseId" IN (
        SELECT id FROM courses WHERE "organizationId" = ${user.organizationId} AND status = 'PUBLISHED'
      )
      AND    rating IS NOT NULL
      GROUP BY "courseId"
    `;
    ratingMap = Object.fromEntries(
      ratingRows.map(r => [r.courseId, { avg: r.avg ? Math.round(r.avg * 10) / 10 : null, count: Number(r.count) }])
    );
  } catch {
    // columna rating aún no existe — migración SQL pendiente
  }

  const enrolledIds  = new Set(enrollments.map(e => e.courseId));
  const completedIds = new Set(
    enrollments.filter(e => e.status === "COMPLETED").map(e => e.courseId)
  );

  const courseItems = courses.map(c => ({
    ...c,
    enrolled:    enrolledIds.has(c.id),
    progress:    progressMap[c.id] ?? 0,
    completed:   completedIds.has(c.id),
    avgRating:   ratingMap[c.id]?.avg ?? null,
    ratingCount: ratingMap[c.id]?.count ?? 0,
  }));

  const enrolledCount   = courseItems.filter(c => c.enrolled).length;
  const availableCount  = courseItems.filter(c => !c.enrolled).length;

  return (
    <CoursesCatalog
      courses={courseItems}
      labels={{
        title:             t("courses.title"),
        subtitle:          `${enrolledCount} ${t("courses.continue").toLowerCase()} · ${availableCount} ${t("courses.start").toLowerCase()}`,
        searchPlaceholder: t("common.search"),
        noCourses:         t("courses.noCourses"),
        noCoursesDesc:     t("courses.noCoursesDesc"),
      }}
    />
  );
}

async function buildProgressMap(
  userId: string,
  enrollments: { courseId: string; course: { modules: { lessons: { id: string }[] }[] } }[]
) {
  const map: Record<string, number> = {};
  for (const enrollment of enrollments) {
    const allLessons = enrollment.course.modules.flatMap(m => m.lessons);
    if (allLessons.length === 0) { map[enrollment.courseId] = 0; continue; }
    const completed = await prisma.lessonProgress.count({
      where: { userId, lessonId: { in: allLessons.map(l => l.id) }, completed: true },
    });
    map[enrollment.courseId] = Math.round((completed / allLessons.length) * 100);
  }
  return map;
}
