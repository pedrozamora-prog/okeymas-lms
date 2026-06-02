import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VideoHeatmap } from "@/components/admin/video-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, FileText, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CourseAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string; organizationId?: string };
  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user?.role ?? "")) {
    redirect("/dashboard");
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({
    where:   { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select:  { id: true, title: true, type: true, duration: true },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || course.organizationId !== user.organizationId) notFound();

  const videoLessons = course.modules.flatMap(m =>
    m.lessons.filter(l => l.type === "VIDEO")
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/courses/${courseId}/edit`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-foreground">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            Analytics de engagement · {course._count.enrollments} alumnos inscritos
          </p>
        </div>
      </div>

      {videoLessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Este curso no tiene lecciones de vídeo todavía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {videoLessons.map((lesson, idx) => (
            <div key={lesson.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  Lección {idx + 1}
                </Badge>
                <h2 className="text-sm font-semibold text-foreground">{lesson.title}</h2>
                {lesson.duration && (
                  <span className="text-xs text-muted-foreground">· {lesson.duration} min</span>
                )}
              </div>
              <VideoHeatmap
                lessonId={lesson.id}
                duration={lesson.duration ? lesson.duration * 60 : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Resumen de otros tipos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Resumen de contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Video,      label: "Vídeos",   count: course.modules.flatMap(m => m.lessons).filter(l => l.type === "VIDEO").length },
              { icon: FileText,   label: "PDFs",     count: course.modules.flatMap(m => m.lessons).filter(l => l.type === "PDF").length },
              { icon: HelpCircle, label: "Quizzes",  count: course.modules.flatMap(m => m.lessons).filter(l => l.type === "QUIZ").length },
            ].map(({ icon: Icon, label, count }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Icon className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                <div>
                  <p className="text-lg font-black text-foreground leading-none">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
