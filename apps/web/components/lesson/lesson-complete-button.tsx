"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignatureModal } from "@/components/ui/signature-modal";
import { CourseRatingModal } from "@/components/lesson/course-rating-modal";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  lessonId:    string;
  courseId:    string;
  courseTitle: string;
  isCompleted: boolean;
  nextLessonId?: string;
}

export function LessonCompleteButton({ lessonId, courseId, courseTitle, isCompleted, nextLessonId }: Props) {
  const router   = useRouter();
  const [loading,          setLoading]          = useState(false);
  const [completed,        setCompleted]        = useState(isCompleted);
  const [showSignature,    setShowSignature]    = useState(false);
  const [pendingCourseId,  setPendingCourseId]  = useState<string | null>(null);
  const [showRating,       setShowRating]       = useState(false);

  async function markComplete() {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        const { queueProgress } = await import("@/lib/offline-db");
        await queueProgress({ lessonId, courseId, type: "complete" });
        setCompleted(true);
        toast.info("Sin conexión — progreso guardado, se sincronizará al reconectar");
        return;
      }

      const res  = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();

      setCompleted(true);
      toast.success("¡Lección completada!");

      // Mostrar toast por cada insignia nueva ganada
      if (Array.isArray(data.newBadges)) {
        for (const badge of data.newBadges as { name: string; description: string; emoji: string; points: number }[]) {
          setTimeout(() => {
            toast.success(
              `${badge.emoji} ¡Nueva insignia desbloqueada!\n${badge.name}`,
              { description: badge.points > 0 ? `+${badge.points} XP` : badge.description, duration: 5000 }
            );
          }, 600);
        }
      }

      // El curso se terminó y requiere firma
      if (data.needsSignature && data.courseId) {
        setPendingCourseId(data.courseId);
        setShowSignature(true);
        return;
      }

      if (data.certificateIssued) {
        toast.success("🎓 ¡Certificado emitido! Consúltalo en tu perfil.");
      }

      if (nextLessonId) {
        router.push(`/dashboard/courses/${courseId}/lessons/${nextLessonId}`);
      } else {
        if (data.courseFinished) {
          setShowRating(true); // mostrar encuesta antes de navegar
          return;
        }
        router.push(`/dashboard/courses/${courseId}`);
      }
      router.refresh();
    } catch {
      toast.error("Error al marcar como completada");
    } finally {
      setLoading(false);
    }
  }

  function handleRatingDone() {
    setShowRating(false);
    router.push(`/dashboard/courses/${courseId}`);
    router.refresh();
  }

  function handleSignComplete(certificateIssued: boolean) {
    setShowSignature(false);
    setPendingCourseId(null);
    if (certificateIssued) toast.success("🎓 ¡Certificado emitido! Consúltalo en tu perfil.");
    toast.success("✅ Firma guardada correctamente.");
    router.push(`/dashboard/courses/${courseId}`);
    router.refresh();
  }

  if (completed && !showSignature) {
    return nextLessonId ? (
      <Button
        className="bg-primary text-yelau-black hover:bg-primary/90 font-bold gap-2"
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
    <>
      <Button
        className="bg-primary text-yelau-black hover:bg-primary/90 font-bold gap-2"
        onClick={markComplete}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Marcar como completada
      </Button>

      {showSignature && pendingCourseId && (
        <SignatureModal
          courseId={pendingCourseId}
          courseTitle={courseTitle}
          onComplete={handleSignComplete}
        />
      )}

      {showRating && (
        <CourseRatingModal
          courseId={courseId}
          courseTitle={courseTitle}
          onDone={handleRatingDone}
        />
      )}
    </>
  );
}
