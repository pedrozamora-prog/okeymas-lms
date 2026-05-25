import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Rutas de aprendizaje" };

export default async function PathsPage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId: string };

  const [paths, enrollments] = await Promise.all([
    prisma.learningPath.findMany({
      include: {
        courses: {
          include: {
            course: {
              include: { modules: { include: { lessons: { select: { id: true } } } } },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.enrollment.findMany({ where: { userId: user.id } }),
  ]);

  const enrolledIds = new Set(enrollments.map((e: { courseId: string }) => e.courseId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Rutas de aprendizaje</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Itinerarios formativos diseñados para tu desarrollo profesional
        </p>
      </div>

      {paths.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No hay rutas disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">
              El administrador aún no ha creado rutas de aprendizaje.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/courses">Ver cursos sueltos</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {paths.map((path) => {
            const totalCourses = path.courses.length;
            const completedCourses = path.courses.filter(
              (pc: { courseId: string }) => enrollments.find(
                (e: { courseId: string; status: string }) => e.courseId === pc.courseId && e.status === "COMPLETED"
              )
            ).length;
            const progressPct = totalCourses > 0
              ? Math.round((completedCourses / totalCourses) * 100)
              : 0;

            return (
              <Card key={path.id} className="overflow-hidden">
                {/* Header */}
                <CardHeader className="pb-3 bg-gradient-to-r from-yelau-yellow/10 to-transparent border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yelau-yellow/20 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-yelau-yellow" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{path.title}</CardTitle>
                        {path.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {path.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {completedCourses}/{totalCourses} cursos
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso general</span>
                      <span className="font-semibold text-foreground">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                </CardHeader>

                {/* Course list */}
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    {path.courses.map((pc: { courseId: string; order: number; course: { id: string; title: string; modules: { lessons: { id: string }[] }[] } }, idx: number) => {
                      const isEnrolled = enrolledIds.has(pc.courseId);
                      const isCompleted = enrollments.find(
                        (e: { courseId: string; status: string }) => e.courseId === pc.courseId && e.status === "COMPLETED"
                      );
                      const totalLessons = pc.course.modules.flatMap((m: { lessons: { id: string }[] }) => m.lessons).length;
                      const isUnlocked = idx === 0 || enrolledIds.has(path.courses[idx - 1]?.courseId);

                      return (
                        <div
                          key={pc.courseId}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            isCompleted
                              ? "border-yelau-yellow/30 bg-yelau-yellow/5"
                              : isUnlocked
                              ? "border-border hover:border-yelau-yellow/30 hover:bg-muted/50"
                              : "border-border/50 opacity-50"
                          )}
                        >
                          {/* Step number */}
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            isCompleted ? "bg-yelau-yellow text-yelau-black" : "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{pc.course.title}</p>
                            <p className="text-xs text-muted-foreground">{totalLessons} lecciones</p>
                          </div>

                          {isUnlocked ? (
                            <Button size="sm" variant={isCompleted ? "outline" : "default"} className="flex-shrink-0 h-8 text-xs" asChild>
                              <Link href={`/dashboard/courses/${pc.courseId}`}>
                                {isCompleted ? "Repasar" : isEnrolled ? "Continuar" : "Empezar"}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                          ) : (
                            <div className="flex-shrink-0 text-muted-foreground/50">
                              <Lock className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
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
