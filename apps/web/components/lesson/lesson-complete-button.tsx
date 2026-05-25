"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
  nextLessonId?: string;
}

export function LessonCompleteButton({ lessonId, courseId, isCompleted, nextLessonId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  async function markComplete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error();
      setCompleted(true);
      toast.success("¡Lección completada!");
      if (nextLessonId) {
        router.push(`/dashboard/courses/${courseId}/lessons/${nextLessonId}`);
      } else {
        router.push(`/dashboard/courses/${courseId}`);
        toast.success("¡Has completado todos los módulos!");
      }
      router.refresh();
    } catch {
      toast.error("Error al marcar como completada");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return nextLessonId ? (
      <Button
        className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
        onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/${nextLessonId}`)}
      >
        Siguiente lección
        <ArrowRight className="w-4 h-4" />
      </Button>
    ) : (
      <Button variant="outline" className="gap-2" onClick={() => router.push(`/dashboard/courses/${courseId}`)}>
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        Volver al curso
      </Button>
    );
  }

  return (
    <Button
      className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
      onClick={markComplete}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
      Marcar como completada
    </Button>
  );
}
