import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/courses/course-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search } from "lucide-react";

export const metadata = { title: "Mis Cursos" };

export default async function CoursesPage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId: string; role: string; department?: string };

  const isEmployee = user.role === "EMPLOYEE";

  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({
      where: {
        organizationId: user.organizationId,
        status: "PUBLISHED",
        // Empleados: solo cursos de su departamento o cursos globales (sin restricción)
        ...(isEmployee && user.department ? {
          OR: [
            { departments: { isEmpty: true } },
            { departments: { has: user.department as never } },
          ],
        } : {}),
      },
      include: {
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

  const enrolled = courses.filter(c => enrollments.some(e => e.courseId === c.id));
  const available = courses.filter(c => !enrollments.some(e => e.courseId === c.id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Mis Cursos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {enrolled.length} inscritos · {available.length} disponibles
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cursos..." className="pl-9" />
        </div>
      </div>

      {/* Cursos inscritos */}
      {enrolled.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-foreground">En progreso</h2>
            <Badge variant="secondary">{enrolled.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {enrolled.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                enrolled
                progress={progressMap[course.id] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cursos disponibles */}
      {available.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-foreground">Disponibles</h2>
            <Badge variant="outline">{available.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {available.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                enrolled={false}
                progress={0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <BookOpen className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-foreground font-semibold">No hay cursos disponibles</p>
          <p className="text-muted-foreground text-sm">El administrador aún no ha publicado cursos.</p>
        </div>
      )}
    </div>
  );
}

async function buildProgressMap(userId: string, enrollments: { courseId: string; course: { modules: { lessons: { id: string }[] }[] } }[]) {
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
