import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Layers, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Gestión de cursos" };

const statusLabel: Record<string, string> = {
  DRAFT:     "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED:  "Archivado",
};
const statusColor: Record<string, string> = {
  DRAFT:     "border-border text-muted-foreground",
  PUBLISHED: "border-green-500/30 text-green-400 bg-green-500/10",
  ARCHIVED:  "border-red-500/30 text-red-400 bg-red-500/10",
};

export default async function AdminCoursesPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string };

  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    redirect("/dashboard");
  }

  const courses = await prisma.course.findMany({
    where: { organizationId: user.organizationId },
    include: {
      modules: { include: { lessons: { select: { id: true } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const stats = {
    total:     courses.length,
    published: courses.filter(c => c.status === "PUBLISHED").length,
    draft:     courses.filter(c => c.status === "DRAFT").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Gestión de cursos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.published} publicados · {stats.draft} borradores · {stats.total} total
          </p>
        </div>
        <Button asChild className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold">
          <Link href="/admin/courses/new">
            <Plus className="w-4 h-4" />
            Nuevo curso
          </Link>
        </Button>
      </div>

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No hay cursos todavía</p>
            <p className="text-sm text-muted-foreground mt-1">Crea tu primer curso para empezar.</p>
          </div>
          <Button asChild className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold">
            <Link href="/admin/courses/new">
              <Plus className="w-4 h-4" />
              Crear primer curso
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => {
            const totalLessons = course.modules.flatMap(m => m.lessons).length;
            return (
              <Card key={course.id} className={cn(
                "transition-colors hover:border-yelau-yellow/30",
                course.status === "ARCHIVED" && "opacity-60"
              )}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-yelau-yellow/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-yelau-yellow" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{course.title}</p>
                        {course.isRequired && (
                          <Badge variant="outline" className="text-[10px] border-yelau-yellow/30 text-yelau-yellow bg-yelau-yellow/10 flex-shrink-0">
                            Obligatorio
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {course.modules.length} módulos
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {totalLessons} lecciones
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course._count.enrollments} inscritos
                        </span>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={`text-[11px] hidden sm:flex ${statusColor[course.status]}`}>
                        {statusLabel[course.status]}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                        <Link href={`/dashboard/courses/${course.id}`} title="Vista previa">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
