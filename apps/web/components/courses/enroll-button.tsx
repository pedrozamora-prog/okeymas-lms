"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

export function EnrollButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEnroll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("¡Inscripción completada!", { description: "Ya puedes empezar el curso." });
      router.refresh();
    } catch {
      toast.error("Error al inscribirse", { description: "Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleEnroll} disabled={loading} className="w-full sm:w-auto">
      <BookOpen className="w-4 h-4" />
      {loading ? "Inscribiendo..." : "Inscribirme en este curso"}
    </Button>
  );
}
