import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CourseForm } from "@/components/admin/course-form";
import { ModuleEditor } from "@/components/admin/module-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Editar curso" };

const statusColor: Record<string, string> = {
  DRAFT:     "border-border text-muted-foreground",
  PUBLISHED: "border-green-500/30 text-green-400 bg-green-500/10",
  ARCHIVED:  "border-red-500/30 text-red-400 bg-red-500/10",
};
const statusLabel: Record<string, string> = {
  DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado",
};

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string };

  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) redirect("/dashboard");

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: { lessons: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course || course.organizationId !== user.organizationId) notFound();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-1 flex-shrink-0" asChild>
          <Link href="/admin/courses">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-foreground truncate">{course.title}</h1>
            <Badge variant="outline" className={cn("text-[11px] flex-shrink-0", statusColor[course.status])}>
              {statusLabel[course.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {course.modules.length} módulos · {course.modules.flatMap(m => m.lessons).length} lecciones
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5" asChild>
          <Link href={`/dashboard/courses/${course.id}`}>
            <Eye className="w-3.5 h-3.5" />
            Vista previa
          </Link>
        </Button>
      </div>

      {/* Tabs simulados */}
      <div className="space-y-8">
        {/* Datos del curso */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
            Datos del curso
          </h2>
          <CourseForm
            initial={{
              id: course.id,
              title: course.title,
              description: course.description,
              thumbnailUrl: course.thumbnailUrl,
              status: course.status,
              isRequired: course.isRequired,
              order: course.order,
              departments: course.departments as string[],
              certificateEnabled: course.certificateEnabled,
              certificateType: course.certificateType,
              certificateValidityDays: course.certificateValidityDays,
              certSignerName: course.certSignerName,
              certSignerTitle: course.certSignerTitle,
            }}
          />
        </section>

        {/* Módulos y lecciones */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
            Contenido del curso
          </h2>
          <ModuleEditor courseId={course.id} initialModules={course.modules} />
        </section>
      </div>
    </div>
  );
}
