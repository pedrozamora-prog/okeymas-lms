"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen, ChevronDown, ChevronUp, Check, Loader2, FileText } from "lucide-react";

interface Props {
  lessonId: string;
}

type SaveState = "idle" | "saving" | "saved";

export function LessonNotes({ lessonId }: Props) {
  const [open,      setOpen]      = useState(false);
  const [content,   setContent]   = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loaded,    setLoaded]    = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar nota al abrir
  useEffect(() => {
    if (!open || loaded) return;
    fetch(`/api/lessons/${lessonId}/notes`)
      .then(r => r.json())
      .then(d => { setContent(d.content ?? ""); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [open, lessonId, loaded]);

  const save = useCallback(async (text: string) => {
    setSaveState("saving");
    try {
      await fetch(`/api/lessons/${lessonId}/notes`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: text }),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }, [lessonId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setContent(text);
    setSaveState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(text), 800);
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <NotebookPen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Mis apuntes</span>
          {content && !open && (
            <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium">
              {wordCount} palabras
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {open && saveState === "saving" && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Guardando…
            </span>
          )}
          {open && saveState === "saved" && (
            <span className="flex items-center gap-1 text-[11px] text-green-500">
              <Check className="w-3 h-3" />
              Guardado
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border">
          {!loaded ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Textarea
                value={content}
                onChange={handleChange}
                placeholder="Escribe tus apuntes aquí… se guardan automáticamente."
                className="mt-3 min-h-[140px] resize-y text-sm bg-muted/30 border-muted-foreground/20 focus:border-primary/50 placeholder:text-muted-foreground/50"
                autoFocus
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {wordCount} {wordCount === 1 ? "palabra" : "palabras"} · {content.length} caracteres
                </span>
                <span>Ctrl+A para seleccionar todo</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
