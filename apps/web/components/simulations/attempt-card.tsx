"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, ThumbsUp, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Evaluation = {
  tone?: string;
  objectiveAchieved?: boolean;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
};

type Props = {
  scenarioTitle: string;
  score: number;
  completedAt: string;
  feedback: string | null;
  evaluation: Evaluation | null;
};

const TONE_LABEL: Record<string, string> = {
  frío: "Frío",
  neutro: "Neutro",
  profesional: "Profesional",
  empático: "Empático",
  excelente: "Excelente",
};

const TONE_COLOR: Record<string, string> = {
  frío:         "bg-blue-500/10   text-blue-400   border-blue-500/20",
  neutro:       "bg-muted/60      text-muted-foreground border-border",
  profesional:  "bg-primary/10   text-primary    border-primary/20",
  empático:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
  excelente:    "bg-green-500/10  text-green-400  border-green-500/20",
};

export function AttemptCard({ scenarioTitle, score, completedAt, feedback, evaluation }: Props) {
  const [open, setOpen] = useState(false);

  const scoreColor =
    score >= 80 ? "text-green-400"
    : score >= 60 ? "text-amber-500"
    : "text-red-400";

  const scoreBg =
    score >= 80 ? "bg-green-500/10 border-green-500/20"
    : score >= 60 ? "bg-amber-500/10 border-amber-500/20"
    : "bg-red-500/10 border-red-500/20";

  const tone = evaluation?.tone?.toLowerCase();
  const objectiveAchieved = evaluation?.objectiveAchieved;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Fila principal */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Puntuación */}
        <div className={cn("w-12 h-12 rounded-xl border flex flex-col items-center justify-center flex-shrink-0", scoreBg)}>
          <span className={cn("text-lg font-black leading-none", scoreColor)}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{scenarioTitle}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(completedAt), "d MMM yyyy · HH:mm", { locale: es })}
            </span>
            {tone && TONE_LABEL[tone] && (
              <Badge className={cn("text-[10px] border", TONE_COLOR[tone] ?? "bg-muted text-muted-foreground border-border")}>
                {TONE_LABEL[tone]}
              </Badge>
            )}
            {objectiveAchieved !== undefined && (
              <span className={cn("flex items-center gap-0.5 text-[11px]", objectiveAchieved ? "text-green-400" : "text-red-400")}>
                {objectiveAchieved
                  ? <><CheckCircle2 className="w-3 h-3" /> Objetivo logrado</>
                  : <><XCircle className="w-3 h-3" /> Objetivo no logrado</>}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {/* Detalle expandido */}
      {open && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {(feedback || evaluation?.summary) && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feedback ?? evaluation?.summary}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {evaluation?.strengths && evaluation.strengths.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> Puntos fuertes
                </p>
                <ul className="space-y-1">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation?.improvements && evaluation.improvements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Áreas de mejora
                </p>
                <ul className="space-y-1">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
