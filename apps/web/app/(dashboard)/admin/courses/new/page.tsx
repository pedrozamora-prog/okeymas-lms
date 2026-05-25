import { CourseForm } from "@/components/admin/course-form";

export const metadata = { title: "Nuevo curso" };

export default function NewCoursePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">Nuevo curso</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rellena los datos básicos. Podrás añadir módulos y lecciones después.
        </p>
      </div>
      <CourseForm />
    </div>
  );
}
