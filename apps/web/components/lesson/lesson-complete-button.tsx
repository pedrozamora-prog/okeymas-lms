"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignatureModal } from "@/components/ui/signature-modal";
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
        router.push(`/dashboard/courses/${courseId}`);
        if (data.courseFinished) toast.success("¡Has completado el curso!");
      }
      router.refresh();
    } catch {
      toast.error("Error al marcar como completada");
    } finally {
      setLoading(false);
    }
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
    <>
      <Button
        className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
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
    </>
  );
}
