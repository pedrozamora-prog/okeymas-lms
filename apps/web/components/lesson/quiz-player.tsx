"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, HelpCircle, Loader2,
  Trophy, RotateCcw, ChevronRight, Clock, AlertTriangle,
} from "lucide-react";

/* ── Tipos ── */
interface Option   { id: string; text: string; order: number }
interface Question { id: string; text: string; order: number; options: Option[] }
interface QuizData {
  id:            string;
  passingScore:  number;
  maxAttempts:   number;
  timeLimitMins: number | null;
  attemptsUsed:  number;
  attemptsLeft:  number;
  lastAttempt:   { score: number; passed: boolean } | null;
  questions:     Question[];
}
interface Result {
  score:          number;
  passed:         boolean;
  correct:        number;
  total:          number;
  correctAnswers: Record<string, string>;
  certificateIssued: boolean;
}

interface Props {
  lessonId:    string;
  courseId:    string;
  nextLessonId?: string;
}

export function QuizPlayer({ lessonId, courseId, nextLessonId }: Props) {
  const router = useRouter();

  const [quiz,      setQuiz]      = useState<QuizData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [submitting,setSubmitting]= useState(false);
  const [result,    setResult]    = useState<Result | null>(null);
  const [timeLeft,  setTimeLeft]  = useState<number | null>(null);

  /* ── Cargar quiz ── */
  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/quiz`)
      .then(r => r.json())
      .then(data => { setQuiz(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lessonId]);

  /* ── Timer ── */
  useEffect(() => {
    if (!quiz?.timeLimitMins || result) return;
    const secs = quiz.timeLimitMins * 60;
    setTimeLeft(secs);
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 1) { clearInterval(interval); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quiz?.id, result]); // eslint-disable-line

  /* ── Enviar ── */
  async function handleSubmit() {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Responde todas las preguntas (faltan ${unanswered.length})`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = quiz.questions.map(q => ({
        questionId:       q.id,
        selectedOptionId: answers[q.id],
      }));
      const res  = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (data.certificateIssued) toast.success("🎉 ¡Certificado emitido!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setAnswers({});
    setResult(null);
    setTimeLeft(quiz?.timeLimitMins ? quiz.timeLimitMins * 60 : null);
    // Recargar quiz para actualizar intentos
    fetch(`/api/lessons/${lessonId}/quiz`).then(r => r.json()).then(setQuiz);
  }

  /* ── Estados de carga / sin quiz ── */
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-7 h-7 animate-spin text-yelau-yellow" />
    </div>
  );

  if (!quiz || quiz.questions.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-border rounded-lg">
      <HelpCircle className="w-10 h-10 text-muted-foreground/30" />
      <p className="font-semibold text-foreground">Este quiz aún no tiene preguntas</p>
      <p className="text-sm text-muted-foreground">El instructor añadirá las preguntas próximamente.</p>
    </div>
  );

  const answeredCount = Object.keys(answers).length;
  const progress      = (answeredCount / quiz.questions.length) * 100;

  /* ── PANTALLA DE RESULTADO ── */
  if (result) {
    const scoreColor = result.passed ? "text-green-500" : "text-red-500";
    const scoreBg    = result.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";

    return (
      <div className="space-y-6">
        {/* Resultado principal */}
        <div className={`rounded-2xl border-2 p-8 text-center space-y-4 ${scoreBg}`}>
          <div className="flex justify-center">
            {result.passed
              ? <Trophy className="w-14 h-14 text-yelau-yellow" />
              : <XCircle className="w-14 h-14 text-red-400" />
            }
          </div>
          <div>
            <p className={`text-5xl font-black ${scoreColor}`}>{result.score}%</p>
            <p className="text-xl font-bold text-foreground mt-2">
              {result.passed ? "¡Aprobado!" : "No aprobado"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {result.correct} de {result.total} preguntas correctas · Nota mínima: {quiz.passingScore}%
            </p>
          </div>
        </div>

        {/* Revisión de respuestas */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Revisión de respuestas</p>
          {quiz.questions.map((q, i) => {
            const selected  = answers[q.id];
            const correct   = result.correctAnswers[q.id];
            const isRight   = selected === correct;
            return (
              <div key={q.id} className={`rounded-xl border p-4 space-y-3 ${
                isRight ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
              }`}>
                <div className="flex items-start gap-2">
                  {isRight
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle      className="w-4 h-4 text-red-400    flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-medium text-foreground">{i + 1}. {q.text}</p>
                </div>
                <div className="grid gap-1.5 pl-6">
                  {q.options.map(opt => {
                    const isSelected = opt.id === selected;
                    const isCorrect  = opt.id === correct;
                    return (
                      <div key={opt.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                        isCorrect  ? "bg-green-500/20 text-green-700 font-semibold" :
                        isSelected ? "bg-red-500/20   text-red-600" :
                                     "text-muted-foreground"
                      }`}>
                        <span>{isCorrect ? "✓" : isSelected ? "✗" : "○"}</span>
                        {opt.text}
                        {isCorrect && !isSelected && <span className="ml-auto text-green-600 text-[10px]">Respuesta correcta</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          {!result.passed && quiz.attemptsLeft > 1 && (
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Intentar de nuevo ({quiz.attemptsLeft - 1} intentos restantes)
            </Button>
          )}
          {(result.passed || quiz.attemptsLeft <= 1) && nextLessonId && (
            <Button
              onClick={() => router.push(`/dashboard/courses/${courseId}/lessons/${nextLessonId}`)}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
            >
              Siguiente lección <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push(`/dashboard/courses/${courseId}`)}>
            Volver al curso
          </Button>
        </div>
      </div>
    );
  }

  /* ── PANTALLA DE QUIZ ── */
  return (
    <div className="space-y-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-yelau-yellow" />
            Quiz — {quiz.questions.length} preguntas
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nota mínima: {quiz.passingScore}% · {quiz.attemptsLeft} intento{quiz.attemptsLeft !== 1 ? "s" : ""} disponible{quiz.attemptsLeft !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timeLeft < 60 ? "text-red-400" : "text-foreground"}`}>
              <Clock className="w-4 h-4" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}
          {quiz.lastAttempt && !result && (
            <div className="text-xs text-muted-foreground">
              Último: {quiz.lastAttempt.score}% ({quiz.lastAttempt.passed ? "aprobado" : "no aprobado"})
            </div>
          )}
        </div>
      </div>

      {/* Progreso de respuestas */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answeredCount} de {quiz.questions.length} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Preguntas */}
      <div className="space-y-5">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className={`rounded-xl border p-5 space-y-3 transition-colors ${
            answers[q.id] ? "border-yelau-yellow/30 bg-yelau-yellow/5" : "border-border"
          }`}>
            <p className="text-sm font-semibold text-foreground">
              <span className="text-yelau-yellow mr-2">{i + 1}.</span>
              {q.text}
            </p>
            <div className="grid gap-2">
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.id;
                return (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selected
                      ? "border-yelau-yellow bg-yelau-yellow/10"
                      : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                  }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? "border-yelau-yellow bg-yelau-yellow" : "border-border"
                    }`}>
                      {selected && <div className="w-1.5 h-1.5 rounded-full bg-yelau-black" />}
                    </div>
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={selected}
                      onChange={() => setAnswers(a => ({ ...a, [q.id]: opt.id }))}
                      className="sr-only"
                    />
                    <span className="text-sm text-foreground">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Aviso preguntas sin contestar */}
      {answeredCount < quiz.questions.length && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Quedan {quiz.questions.length - answeredCount} pregunta{quiz.questions.length - answeredCount > 1 ? "s" : ""} sin responder
        </div>
      )}

      {/* Botón enviar */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || answeredCount < quiz.questions.length}
        className="w-full h-12 bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 text-base"
      >
        {submitting
          ? <><Loader2 className="w-5 h-5 animate-spin" />Evaluando…</>
          : <>Enviar respuestas <ChevronRight className="w-5 h-5" /></>
        }
      </Button>
    </div>
  );
}
