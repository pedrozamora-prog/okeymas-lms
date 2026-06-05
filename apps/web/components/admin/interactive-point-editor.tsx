"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Badge }  from "@/components/ui/badge";
import { toast }  from "sonner";
import { Plus, Trash2, Clock, HelpCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id:        string;
  text:      string;
  isCorrect: boolean;
}

interface IPoint {
  id:        string;
  timestamp: number;
  question:  string;
  options:   Option[];
  canSkip:   boolean;
  skipAfter: number | null;
}

function secToMmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function mmssToSec(v: string) {
  const [m, s] = v.split(":").map(Number);
  return (m || 0) * 60 + (s || 0);
}

function newOption(): Option {
  return { id: crypto.randomUUID(), text: "", isCorrect: false };
}

export function InteractivePointEditor({ lessonId }: { lessonId: string }) {
  const [points,  setPoints]  = useState<IPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [adding,  setAdding]  = useState(false);

  // Form state
  const [tsInput,   setTsInput]   = useState("0:30");
  const [question,  setQuestion]  = useState("");
  const [options,   setOptions]   = useState<Option[]>([newOption(), newOption(), newOption(), newOption()]);
  const [canSkip,   setCanSkip]   = useState(false);

  const loadPoints = useCallback(() => {
    fetch(`/api/lessons/${lessonId}/interactive`)
      .then(r => r.json())
      .then(d => { setPoints(d.points ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => { loadPoints(); }, [loadPoints]);

  const handleAddPoint = async () => {
    const hasCorrect = options.some(o => o.isCorrect);
    const filledOpts = options.filter(o => o.text.trim());
    if (!question.trim())    return toast.error("Escribe la pregunta");
    if (filledOpts.length < 2) return toast.error("Añade al menos 2 opciones");
    if (!hasCorrect)         return toast.error("Marca una opción como correcta");

    setSaving(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/interactive`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          timestamp: mmssToSec(tsInput),
          question:  question.trim(),
          options:   filledOpts,
          canSkip,
          skipAfter: null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pregunta interactiva añadida");
      setQuestion(""); setOptions([newOption(), newOption(), newOption(), newOption()]); setAdding(false);
      loadPoints();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pointId: string) => {
    await fetch(`/api/lessons/${lessonId}/interactive?pointId=${pointId}`, { method: "DELETE" });
    setPoints(prev => prev.filter(p => p.id !== pointId));
    toast.success("Pregunta eliminada");
  };

  const setOptionField = (idx: number, field: keyof Option, value: string | boolean) => {
    setOptions(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const markCorrect = (idx: number) => {
    setOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  };

  if (loading) return <div className="h-12 animate-pulse bg-muted rounded-lg" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Preguntas interactivas</span>
          {points.length > 0 && <Badge variant="secondary" className="text-[10px]">{points.length}</Badge>}
        </div>
        {!adding && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3" /> Añadir pregunta
          </Button>
        )}
      </div>

      {/* Lista de puntos existentes */}
      {points.map(p => (
        <div key={p.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
          <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-mono">{secToMmss(p.timestamp)}</Badge>
              {p.canSkip && <Badge variant="secondary" className="text-[10px]">Opcional</Badge>}
            </div>
            <p className="text-xs font-medium text-foreground truncate">{p.question}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {(p.options as Option[]).length} opciones ·{" "}
              <span className="text-green-400">
                {(p.options as Option[]).find((o: Option) => o.isCorrect)?.text ?? "—"}
              </span>
            </p>
          </div>
          <button
            onClick={() => handleDelete(p.id)}
            className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Formulario para añadir */}
      {adding && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          {/* Timestamp */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs">Momento del vídeo (mm:ss)</Label>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={tsInput}
                  onChange={e => setTsInput(e.target.value)}
                  placeholder="0:30"
                  className="h-8 text-xs font-mono w-24"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="canSkip"
                checked={canSkip}
                onChange={e => setCanSkip(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="canSkip" className="text-xs cursor-pointer">Puede saltar</Label>
            </div>
          </div>

          {/* Pregunta */}
          <div>
            <Label className="text-xs">Pregunta</Label>
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="¿Cuál es la temperatura correcta del agua...?"
              className="h-8 text-xs mt-1"
            />
          </div>

          {/* Opciones */}
          <div className="space-y-1.5">
            <Label className="text-xs">Opciones (marca la correcta con ✓)</Label>
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => markCorrect(idx)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                    opt.isCorrect
                      ? "border-green-500 bg-green-500"
                      : "border-border hover:border-green-400"
                  )}
                >
                  {opt.isCorrect && <Check className="w-3 h-3 text-white" />}
                </button>
                <Input
                  value={opt.text}
                  onChange={e => setOptionField(idx, "text", e.target.value)}
                  placeholder={`Opción ${idx + 1}`}
                  className="h-7 text-xs flex-1"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-7 text-xs" onClick={handleAddPoint} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar pregunta"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
