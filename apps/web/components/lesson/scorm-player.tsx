"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ScormPlayerProps {
  lessonId: string;
  courseId: string;
  launchPath: string; // e.g. "lessonId/index.html" — strip the lessonId prefix for the proxy URL
  isCompleted: boolean;
  nextLessonId?: string;
}

// SCORM 1.2 CMI data model defaults
const CMI_DEFAULTS: Record<string, string> = {
  "cmi.core.student_id": "",
  "cmi.core.student_name": "",
  "cmi.core.lesson_status": "not attempted",
  "cmi.core.lesson_location": "",
  "cmi.core.score.raw": "",
  "cmi.core.score.min": "",
  "cmi.core.score.max": "",
  "cmi.core.total_time": "0000:00:00",
  "cmi.core.session_time": "0000:00:00",
  "cmi.core.exit": "",
  "cmi.suspend_data": "",
  "cmi.launch_data": "",
  "cmi.comments": "",
  "cmi.comments_from_lms": "",
};

export function ScormPlayer({ lessonId, launchPath, isCompleted, nextLessonId, courseId }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(isCompleted);

  // CMI data storage (in-memory during session, persisted on LMSCommit/LMSFinish)
  const cmiData = useRef<Record<string, string>>({ ...CMI_DEFAULTS });
  const initialized = useRef(false);

  // Strip the lessonId prefix from the stored path to get the file's relative path within the package
  const fileRelativePath = launchPath.startsWith(`${lessonId}/`)
    ? launchPath.slice(lessonId.length + 1)
    : launchPath;
  const iframeSrc = `/api/scorm/${lessonId}/files/${fileRelativePath}`;

  // Load saved CMI data from server before mounting the iframe
  useEffect(() => {
    fetch(`/api/scorm/${lessonId}/runtime`)
      .then(r => r.json())
      .then((res: { data: Record<string, string> }) => {
        if (res.data && typeof res.data === "object") {
          cmiData.current = { ...CMI_DEFAULTS, ...res.data };
        }
      })
      .catch(() => {/* silently use defaults */})
      .finally(() => setLoading(false));
  }, [lessonId]);

  // Inject window.API into the iframe before it loads (using onLoad)
  useEffect(() => {
    if (loading) return;

    function injectAPI(iframeWindow: Window) {
      // @ts-expect-error SCORM 1.2 API injection
      iframeWindow.API = {
        LMSInitialize: (_param: string) => {
          initialized.current = true;
          return "true";
        },

        LMSFinish: (_param: string) => {
          persistCmi();
          return "true";
        },

        LMSGetValue: (element: string) => {
          return cmiData.current[element] ?? "";
        },

        LMSSetValue: (element: string, value: string) => {
          cmiData.current[element] = String(value);

          const status = cmiData.current["cmi.core.lesson_status"];
          if (element === "cmi.core.lesson_status" && (value === "passed" || value === "completed")) {
            setCompleted(true);
            toast.success("¡Lección SCORM completada!");
          }
          return "true";
        },

        LMSCommit: (_param: string) => {
          persistCmi();
          return "true";
        },

        LMSGetLastError: () => "0",
        LMSGetErrorString: (_code: string) => "No error",
        LMSGetDiagnostic: (_code: string) => "",
      };
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    function onLoad() {
      try {
        if (iframe?.contentWindow) {
          injectAPI(iframe.contentWindow);
        }
      } catch {
        // cross-origin — shouldn't happen since we proxy through same origin
        setError("Error de origen: el contenido SCORM no se pudo cargar correctamente.");
      }
    }

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [loading, lessonId]);

  async function persistCmi() {
    try {
      await fetch(`/api/scorm/${lessonId}/runtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: cmiData.current }),
      });
    } catch {
      // Non-critical — progress will be lost for this session
    }
  }

  function goFullscreen() {
    iframeRef.current?.requestFullscreen?.();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando paquete SCORM…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] rounded-xl border border-destructive/30 bg-destructive/5">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <AlertCircle className="w-8 h-8 text-destructive/70" />
          <p className="text-sm font-medium text-foreground">Error al cargar el contenido SCORM</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {completed ? (
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completado
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              En progreso
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={goFullscreen}
          className="gap-1.5 text-xs h-7"
        >
          <Maximize2 className="w-3 h-3" />
          Pantalla completa
        </Button>
      </div>

      {/* SCORM iframe */}
      <div className="rounded-xl border border-border overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full"
          style={{ height: "600px", border: "none" }}
          title="Contenido SCORM"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-top-navigation-by-user-activation"
        />
      </div>

      {/* Next lesson hint */}
      {completed && nextLessonId && (
        <div className="flex items-center justify-end">
          <a
            href={`/dashboard/courses/${courseId}/lessons/${nextLessonId}`}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Continuar con la siguiente lección →
          </a>
        </div>
      )}
    </div>
  );
}
