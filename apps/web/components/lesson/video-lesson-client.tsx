"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VideoTracker } from "./video-tracker";
import { InteractiveOverlay, type InteractivePointData } from "./interactive-overlay";

interface Props {
  videoUrl:    string;
  title:       string;
  lessonId:    string;
  courseId:    string;
  isCompleted: boolean;
  nextLessonId?: string;
}

export function VideoLessonClient({
  videoUrl, title, lessonId, courseId, isCompleted, nextLessonId,
}: Props) {
  const router   = useRouter();
  const [done,   setDone]   = useState(isCompleted);
  const [saving, setSaving] = useState(false);

  // Interactive points
  const [points,       setPoints]       = useState<InteractivePointData[]>([]);
  const [activePoint,  setActivePoint]  = useState<InteractivePointData | null>(null);
  const answeredIds = useRef<Set<string>>(new Set());

  // Cargar interactive points al montar
  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/interactive`)
      .then(r => r.json())
      .then(d => setPoints(d.points ?? []))
      .catch(() => {});
  }, [lessonId]);

  const handleEnded = useCallback(async () => {
    if (done || saving) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      const data = await res.json();
      setDone(true);
      if (data.certificateIssued) {
        toast.success("🎉 ¡Certificado emitido! Lo encontrarás en tu perfil.");
      } else {
        toast.success("Lección completada automáticamente");
      }
      if (nextLessonId) {
        setTimeout(() => router.push(`/dashboard/courses/${courseId}/lessons/${nextLessonId}`), 2000);
      } else {
        router.refresh();
      }
    } catch {
      // fallo silencioso
    } finally {
      setSaving(false);
    }
  }, [done, saving, lessonId, courseId, nextLessonId, router]);

  const handleTimeUpdate = useCallback((currentSeconds: number) => {
    if (activePoint) return; // ya hay un overlay activo

    const triggered = points.find(p =>
      !answeredIds.current.has(p.id) &&
      currentSeconds >= p.timestamp &&
      currentSeconds < p.timestamp + 3 // ventana de 3s para capturar el momento
    );

    if (triggered) {
      setActivePoint(triggered);
    }
  }, [activePoint, points]);

  const handleAnswer = useCallback((pointId: string, optionId: string, correct: boolean) => {
    // Guardar respuesta en BD
    fetch(`/api/lessons/${lessonId}/interactive/answer`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ pointId, optionId }),
    }).catch(() => {});

    answeredIds.current.add(pointId);
    if (correct) toast.success("¡Correcto! Continuando el vídeo…", { duration: 1500 });
    else         toast.error("Incorrecto. Revisa el vídeo con atención.", { duration: 1500 });

    setTimeout(() => setActivePoint(null), 300);
  }, [lessonId]);

  const handleSkip = useCallback((pointId: string) => {
    answeredIds.current.add(pointId);
    setActivePoint(null);
  }, []);

  return (
    <div className="relative">
      <VideoTracker
        uid={videoUrl}
        title={title}
        lessonId={lessonId}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Interactive overlay — pausa visualmente el vídeo (el iframe sigue corriendo pero el overlay bloquea la interacción) */}
      {activePoint && (
        <InteractiveOverlay
          point={activePoint}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
        />
      )}
    </div>
  );
}
