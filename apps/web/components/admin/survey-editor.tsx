"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ClipboardList, Plus, Trash2, GripVertical, Save, Star, MessageSquare, BarChart3 } from "lucide-react";

interface Question {
  id:       string;
  text:     string;
  type:     "NPS" | "RATING" | "TEXT" | "CHOICE";
  options:  string[];
  order:    number;
}

interface Props {
  courseId:      string;
  initialSurvey: { id?: string; isActive: boolean; questions: Question[] } | null;
}

const Q_TYPES = [
  { value: "NPS",    label: "NPS (0-10)",        icon: BarChart3     },
  { value: "RATING", label: "Valoración (1-5 ⭐)", icon: Star         },
  { value: "TEXT",   label: "Respuesta libre",    icon: MessageSquare },
];

export function SurveyEditor({ courseId, initialSurvey }: Props) {
  const [questions, setQuestions] = useState<Question[]>(
    initialSurvey?.questions ?? []
  );
  const [isActive, setActive] = useState(initialSurvey?.isActive ?? true);
  const [saving, setSaving]   = useState(false);

  function addQuestion() {
    setQuestions(q => [...q, {
      id:      crypto.randomUUID(),
      text:    "",
      type:    "RATING",
      options: [],
      order:   q.length,
    }]);
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions(q => q.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  function removeQuestion(id: string) {
    setQuestions(q => q.filter(x => x.id !== id).map((x, i) => ({ ...x, order: i })));
  }

  async function handleSave() {
    if (questions.some(q => !q.text.trim())) {
      toast.error("Todas las preguntas deben tener texto");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/surveys", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ courseId, questions, isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Encuesta guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-yelau-yellow" />
          <h3 className="font-bold text-foreground">Encuesta post-curso</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setActive} id="survey-active" />
            <label htmlFor="survey-active" className="text-sm text-muted-foreground cursor-pointer">
              {isActive ? "Activa" : "Inactiva"}
            </label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 h-8">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        La encuesta se mostrará al alumno al completar el curso. Sus respuestas son anónimas para el alumno pero visibles para el administrador.
      </p>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      value={q.text}
                      onChange={e => updateQuestion(q.id, { text: e.target.value })}
                      placeholder="Escribe la pregunta..."
                      className="flex-1"
                    />
                    <Select value={q.type} onValueChange={v => updateQuestion(q.id, { type: v as Question["type"] })}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Q_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {q.type === "NPS" && (
                    <p className="text-xs text-muted-foreground pl-7">
                      El alumno puntuará de 0 a 10. Se calcula el NPS automáticamente.
                    </p>
                  )}
                  {q.type === "RATING" && (
                    <p className="text-xs text-muted-foreground pl-7">
                      El alumno elegirá entre 1 y 5 estrellas.
                    </p>
                  )}
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-muted-foreground hover:text-red-500 transition-colors mt-2 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={addQuestion} variant="outline" className="w-full gap-2 border-dashed">
        <Plus className="w-4 h-4" />
        Añadir pregunta
      </Button>

      {questions.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Añade preguntas para activar la encuesta post-curso
        </p>
      )}
    </div>
  );
}
