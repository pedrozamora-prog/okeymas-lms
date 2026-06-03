import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, ChevronRight, Lock, CheckCircle2, AlertTriangle, GitBranch } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Rutas de aprendizaje" };

export default async function PathsPage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId: string };

  const [paths, enrollments, quizAttempts] = await Promise.all([
    prisma.learningPath.findMany({
      where: { organizationId: user.organizationId, isActive: true },
      include: {
        courses: {
          include: {
            course: {
              include: {
                modules: { include: { lessons: { select: { id: true } } } },
                // include quiz to check pass/fail
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.enrollment.findMany({ where: { userId: user.id } }),
    // Get latest quiz attempt per quiz for this user
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const enrollmentMap = new Map(enrollments.map(e => [e.courseId, e]));

  // Helper: did the user pass the quiz for a course?
  async function didPassCourseQuiz(courseId: string): Promise<boolean> {
    // Find all lessons with quizzes in this course
    const course = paths
      .flatMap(p => p.courses)
      .find(pc => pc.courseId === courseId)?.course;
    if (!course) return true;

    // Find quiz lessons
    const lessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const quizzes   = await prisma.quiz.findMany({
      where: { lessonId: { in: lessonIds } },
      select: { id: true },
    });
    if (quizzes.length === 0) return true; // no quiz → counts as passed

    // Check if user passed any attempt for any quiz in this course
    for (const quiz of quizzes) {
      const passed = quizAttempts.find(a => a.quizId === quiz.id && a.passed);
      if (passed) return true;
    }
    return false;
  }

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
          {paths.map(async (path) => {
            const totalCourses     = path.courses.length;
            const completedCourses = path.courses.filter(pc => enrollmentMap.get(pc.courseId)?.status === "COMPLETED").length;
            const progressPct      = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

            // Compute unlock status for each step with branching logic
            const stepStatus: { unlocked: boolean; passed: boolean; completed: boolean; needsRemedial: boolean; remedialCourseTitle?: string }[] = [];

            for (let i = 0; i < path.courses.length; i++) {
              const pc         = path.courses[i];
              const enrollment = enrollmentMap.get(pc.courseId);
              const completed  = enrollment?.status === "COMPLETED";
              const enrolled   = !!enrollment;

              if (i === 0) {
                stepStatus.push({ unlocked: true, passed: await didPassCourseQuiz(pc.courseId), completed, needsRemedial: false });
                continue;
              }

              const prev         = path.courses[i - 1];
              const prevEnroll   = enrollmentMap.get(prev.courseId);
              const prevComplete = prevEnroll?.status === "COMPLETED";
              const prevPassed   = await didPassCourseQuiz(prev.courseId);

              // If prev has onFailGoTo and prev quiz was NOT passed → need to complete remedial first
              let needsRemedial = false;
              let remedialCourseTitle: string | undefined;
              if (prev.onFailGoTo && prevComplete && !prevPassed) {
                const remedialEnroll = enrollmentMap.get(prev.onFailGoTo);
                const remedialDone   = remedialEnroll?.status === "COMPLETED";
                needsRemedial  = !remedialDone;
                remedialCourseTitle = path.courses.find(c => c.courseId === prev.onFailGoTo)?.course.title;
              }

              const unlocked = prevComplete && !needsRemedial;
              stepStatus.push({ unlocked, passed: await didPassCourseQuiz(pc.courseId), completed, needsRemedial, remedialCourseTitle });
            }

            return (
              <Card key={path.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-yelau-yellow/10 to-transparent border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yelau-yellow/20 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-yelau-yellow" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{path.title}</CardTitle>
                        {path.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{path.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-xs">
                      {completedCourses}/{totalCourses} cursos
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso general</span>
                      <span className="font-semibold text-foreground">{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                </CardHeader>

                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    {path.courses.map((pc, idx) => {
                      const s          = stepStatus[idx];
                      const totalLess  = pc.course.modules.flatMap(m => m.lessons).length;
                      const enrollment = enrollmentMap.get(pc.courseId);
                      const isEnrolled = !!enrollment;

                      return (
                        <div key={pc.courseId}>
                          <div className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                            s.completed ? "border-yelau-yellow/30 bg-yelau-yellow/5"
                            : s.needsRemedial ? "border-orange-500/30 bg-orange-500/5"
                            : s.unlocked ? "border-border hover:border-yelau-yellow/30 hover:bg-muted/50"
                            : "border-border/50 opacity-50"
                          )}>
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                              s.completed ? "bg-yelau-yellow text-yelau-black" : "bg-muted text-muted-foreground"
                            )}>
                              {s.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{pc.course.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">{totalLess} lecciones</p>
                                {pc.onFailGoTo && (
                                  <span className="text-[9px] text-orange-400 flex items-center gap-0.5">
                                    <GitBranch className="w-2.5 h-2.5" /> Ruta condicional
                                  </span>
                                )}
                              </div>
                              {s.needsRemedial && s.remedialCourseTitle && (
                                <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Completa "{s.remedialCourseTitle}" primero para continuar
                                </p>
                              )}
                            </div>

                            {s.unlocked && !s.needsRemedial ? (
                              <Button size="sm" variant={s.completed ? "outline" : "default"}
                                className="flex-shrink-0 h-8 text-xs" asChild>
                                <Link href={`/dashboard/courses/${pc.courseId}`}>
                                  {s.completed ? "Repasar" : isEnrolled ? "Continuar" : "Empezar"}
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            ) : s.needsRemedial ? (
                              <Button size="sm" variant="outline"
                                className="flex-shrink-0 h-8 text-xs border-orange-500/30 text-orange-500" asChild>
                                <Link href={`/dashboard/courses/${pc.onFailGoTo!}`}>
                                  <BookOpen className="w-3 h-3 mr-1" />Ir al remedial
                                </Link>
                              </Button>
                            ) : (
                              <div className="flex-shrink-0 text-muted-foreground/50">
                                <Lock className="w-4 h-4" />
                              </div>
                            )}
                          </div>
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
