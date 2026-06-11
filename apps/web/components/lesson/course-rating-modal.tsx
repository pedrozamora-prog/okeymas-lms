"use client";

import { useState } from "react";
import { Star, X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  courseId:    string;
  courseTitle: string;
  onDone: () => void;
}

export function CourseRatingModal({ courseId, courseTitle, onDone }: Props) {
  const [rating,   setRating]   = useState(0);
  const [hover,    setHover]    = useState(0);
  const [comment,  setComment]  = useState("");
  const [loading,  setLoading]  = useState(false);

  async function submit() {
    if (rating === 0) return;
    setLoading(true);
    try {
      await fetch(`/api/courses/${courseId}/rate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      toast.success("¡Gracias por tu valoración! 🌟");
    } catch {
      // Error no crítico — seguimos
    } finally {
      setLoading(false);
      onDone();
    }
  }

  const labels = ["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"];
  const active = hover || rating;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-foreground">🎓 ¡Curso completado!</h2>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{courseTitle}</p>
            </div>
            <button onClick={onDone} className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Estrellas */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">¿Cómo valorarías este curso?</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      "w-9 h-9 transition-colors",
                      n <= active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
              {active > 0 && (
                <span className="text-sm font-medium text-yellow-400 ml-1">{labels[active]}</span>
              )}
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Comentario opcional</p>
            <Textarea
              placeholder="¿Qué te ha parecido el contenido? ¿Algo que mejorarías?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="text-sm resize-none h-20"
              maxLength={500}
            />
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={submit}
              disabled={rating === 0 || loading}
              className="flex-1 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar valoración
            </Button>
            <Button variant="ghost" onClick={onDone} className="text-muted-foreground text-sm">
              Omitir
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
