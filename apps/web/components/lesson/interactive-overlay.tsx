"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, SkipForward, HelpCircle } from "lucide-react";

interface Option {
  id:        string;
  text:      string;
  isCorrect: boolean;
}

export interface InteractivePointData {
  id:        string;
  timestamp: number;
  question:  string;
  options:   Option[];
  canSkip:   boolean;
  skipAfter: number | null;
}

interface InteractiveOverlayProps {
  point:    InteractivePointData;
  onAnswer: (pointId: string, optionId: string, correct: boolean) => void;
  onSkip:   (pointId: string) => void;
}

export function InteractiveOverlay({ point, onAnswer, onSkip }: InteractiveOverlayProps) {
  const [selected,  setSelected]  = useState<string | null>(null);
  const [revealed,  setRevealed]  = useState(false);
  const [countdown, setCountdown] = useState(point.skipAfter ?? null);

  // Countdown para auto-skip
  useEffect(() => {
    if (!point.canSkip || !point.skipAfter) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onSkip(point.id);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [point.canSkip, point.skipAfter, point.id, onSkip]);

  const handleSelect = useCallback((opt: Option) => {
    if (revealed) return;
    setSelected(opt.id);
    setRevealed(true);
    // Pequeña pausa para mostrar el feedback antes de avanzar
    setTimeout(() => {
      onAnswer(point.id, opt.id, opt.isCorrect);
    }, 1200);
  }, [revealed, point.id, onAnswer]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="w-full max-w-lg mx-4 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-5 py-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            Pregunta del vídeo
          </p>
          {countdown !== null && (
            <span className="ml-auto text-xs text-muted-foreground">
              Continúa en {countdown}s
            </span>
          )}
        </div>

        {/* Question */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-sm font-semibold text-foreground leading-snug">{point.question}</p>
        </div>

        {/* Options */}
        <div className="px-5 pb-5 space-y-2">
          {point.options.map(opt => {
            const isSelected  = selected === opt.id;
            const showCorrect = revealed && opt.isCorrect;
            const showWrong   = revealed && isSelected && !opt.isCorrect;

            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                disabled={revealed}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all duration-200",
                  "disabled:cursor-default",
                  showCorrect && "border-green-500 bg-green-500/10 text-green-400 font-medium",
                  showWrong   && "border-red-500 bg-red-500/10 text-red-400",
                  !revealed && "border-border hover:border-primary/60 hover:bg-primary/5 cursor-pointer",
                  !revealed && isSelected && "border-primary bg-primary/10",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{opt.text}</span>
                  {showCorrect && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                  {showWrong   && <XCircle      className="w-4 h-4 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip button */}
        {point.canSkip && !revealed && countdown === null && (
          <div className="px-5 pb-4 flex justify-end">
            <button
              onClick={() => onSkip(point.id)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Saltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
