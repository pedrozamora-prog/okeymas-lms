"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Star, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id:      string;
  text:    string;
  type:    "NPS" | "RATING" | "TEXT" | "CHOICE";
  options: string[];
  order:   number;
}

interface Props {
  open:     boolean;
  onClose:  () => void;
  courseId: string;
  surveyId: string;
  questions: Question[];
}

function RatingInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "transition-transform hover:scale-110",
            n <= (value ?? 0) ? "text-yelau-yellow" : "text-muted-foreground/30"
          )}
        >
          <Star className="w-7 h-7" fill={n <= (value ?? 0) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

function NpsInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-bold border transition-all",
              value === i
                ? "bg-yelau-yellow text-yelau-black border-yelau-yellow"
                : "border-border hover:border-yelau-yellow/50 text-muted-foreground"
            )}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0 — Muy improbable</span>
        <span>10 — Muy probable</span>
      </div>
    </div>
  );
}

export function CourseSurveyModal({ open, onClose, courseId, surveyId, questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, number | string | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  function setAnswer(questionId: string, value: number | string) {
    setAnswers(a => ({ ...a, [questionId]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/survey`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ surveyId, answers }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      toast.error("Error al enviar la encuesta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-yelau-yellow" />
            Encuesta de satisfacción
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">¡Gracias por tu opinión!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tu feedback nos ayuda a mejorar la formación.
              </p>
            </div>
            <Button onClick={onClose} className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold">
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <p className="text-sm text-muted-foreground">
              Solo te llevará un momento. Tus respuestas son confidenciales.
            </p>

            {questions.map((q, idx) => (
              <div key={q.id} className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                  {q.text}
                </p>

                {q.type === "RATING" && (
                  <RatingInput
                    value={answers[q.id] as number ?? null}
                    onChange={v => setAnswer(q.id, v)}
                  />
                )}

                {q.type === "NPS" && (
                  <NpsInput
                    value={answers[q.id] as number ?? null}
                    onChange={v => setAnswer(q.id, v)}
                  />
                )}

                {q.type === "TEXT" && (
                  <Textarea
                    value={(answers[q.id] as string) ?? ""}
                    onChange={e => setAnswer(q.id, e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="resize-none min-h-[80px]"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold flex-1 gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar valoración
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Ahora no
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
