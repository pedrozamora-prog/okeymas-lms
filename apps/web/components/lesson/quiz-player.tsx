"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, XCircle, HelpCircle, Loader2,
  Trophy, RotateCcw, ChevronRight, Clock, AlertTriangle, GripVertical,
} from "lucide-react";

/* ── Tipos ── */
type QType = "MULTIPLE_CHOICE"|"TRUE_FALSE"|"ORDER_ITEMS"|"FILL_BLANK"|"FREE_TEXT"|"IMAGE_CHOICE";
interface Option   { id: string; text: string; order: number }
interface Question {
  id: string; text: string; type: QType; imageUrl?: string | null;
  explanation?: string | null; order: number; options: Option[];
}
interface QuizData {
  id: string; passingScore: number; maxAttempts: number;
  timeLimitMins: number | null; attemptsUsed: number; attemptsLeft: number;
  lastAttempt: { score: number; passed: boolean } | null;
  questions: Question[];
}
type AnswerValue = string | string[];
interface Result {
  score: number; passed: boolean; correct: number; total: number;
  correctAnswers: Record<string, unknown>;
  perQuestionScore: Record<string, number>;
  certificateIssued: boolean;
}
interface Props { lessonId: string; courseId: string; nextLessonId?: string }

/* ── Question renderers ─────────────────────────────────────────────────── */
function MCQuestion({ q, answer, onAnswer }: { q:Question; answer:string; onAnswer:(v:string)=>void }) {
  return (
    <>
      {q.imageUrl && <img src={q.imageUrl} alt="" className="rounded-lg max-h-48 object-cover mb-3" />}
      <div className="grid gap-2">
        {q.options.map(opt => {
          const sel = answer === opt.id;
          return (
            <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              sel ? "border-yelau-yellow bg-yelau-yellow/10" : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel?"border-yelau-yellow bg-yelau-yellow":"border-border"}`}>
                {sel && <div className="w-1.5 h-1.5 rounded-full bg-yelau-black" />}
              </div>
              <input type="radio" name={q.id} value={opt.id} checked={sel} onChange={()=>onAnswer(opt.id)} className="sr-only" />
              <span className="text-sm text-foreground">{opt.text}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}

function TFQuestion({ q, answer, onAnswer }: { q:Question; answer:string; onAnswer:(v:string)=>void }) {
  return (
    <div className="flex gap-3">
      {q.options.map(opt => {
        const sel = answer === opt.id;
        return (
          <button key={opt.id} type="button" onClick={()=>onAnswer(opt.id)}
            className={`flex-1 py-4 rounded-xl font-bold text-base border-2 transition-all ${
              sel ? "border-yelau-yellow bg-yelau-yellow text-yelau-black" : "border-border hover:border-yelau-yellow/40"}`}>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}

function OrderQuestion({ q, answer, onAnswer }: { q:Question; answer:string[]; onAnswer:(v:string[])=>void }) {
  const items = answer.length ? answer : q.options.map(o=>o.id);
  const opts  = Object.fromEntries(q.options.map(o=>[o.id, o.text]));
  const dragIdx = useRef<number|null>(null);

  function onDragStart(i:number) { dragIdx.current = i; }
  function onDrop(i:number) {
    if (dragIdx.current === null || dragIdx.current === i) return;
    const arr = [...items];
    const [moved] = arr.splice(dragIdx.current, 1);
    arr.splice(i, 0, moved);
    dragIdx.current = null;
    onAnswer(arr);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Arrastra los elementos en el orden correcto.</p>
      {items.map((id, i) => (
        <div key={id} draggable
          onDragStart={()=>onDragStart(i)}
          onDragOver={e=>e.preventDefault()}
          onDrop={()=>onDrop(i)}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-grab active:cursor-grabbing hover:border-yelau-yellow/40 transition-colors">
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-yelau-yellow font-bold text-xs w-5">{i+1}.</span>
          <span className="text-sm text-foreground">{opts[id]}</span>
        </div>
      ))}
    </div>
  );
}

function FillBlankQuestion({ q, answer, onAnswer }: { q:Question; answer:string[]; onAnswer:(v:string[])=>void }) {
  const parts = q.text.split(/(\[___\])/g);
  let blankIdx = 0;
  return (
    <div className="space-y-3">
      <div className="text-sm text-foreground flex flex-wrap items-center gap-1 leading-8">
        {parts.map((part, i) => {
          if (part === "[___]") {
            const idx = blankIdx++;
            return (
              <input key={i} value={answer[idx]??""} onChange={e=>{const a=[...answer];a[idx]=e.target.value;onAnswer(a);}}
                className="border-b-2 border-yelau-yellow bg-transparent w-28 text-center focus:outline-none text-foreground text-sm" />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      {q.options.length > 0 && !q.text.includes("[___]") && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Escribe tu respuesta:</p>
          {q.options.map((_,i)=>(
            <input key={i} value={answer[i]??""} onChange={e=>{const a=[...(answer.length?answer:Array(q.options.length).fill(""))];a[i]=e.target.value;onAnswer(a);}}
              placeholder={`Respuesta ${i+1}…`}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50 text-foreground" />
          ))}
        </div>
      )}
    </div>
  );
}

function FreeTextQuestion({ q, answer, onAnswer }: { q:Question; answer:string; onAnswer:(v:string)=>void }) {
  return (
    <div className="space-y-2">
      <textarea value={answer} onChange={e=>onAnswer(e.target.value)} rows={5}
        placeholder="Escribe tu respuesta aquí…"
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50 text-foreground resize-none" />
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <span className="inline-block w-2 h-2 rounded-full bg-purple-400" />
        Esta pregunta será evaluada por IA
      </p>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function QuizPlayer({ lessonId, courseId, nextLessonId }: Props) {
  const router = useRouter();
  const [quiz,       setQuiz]       = useState<QuizData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [answers,    setAnswers]    = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState<Result | null>(null);
  const [timeLeft,   setTimeLeft]   = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/quiz`).then(r=>r.json()).then(d=>{setQuiz(d);setLoading(false);}).catch(()=>setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (!quiz?.timeLimitMins || result) return;
    const secs = quiz.timeLimitMins * 60;
    setTimeLeft(secs);
    const iv = setInterval(()=>{
      setTimeLeft(t=>{ if(t===null||t<=1){clearInterval(iv);handleSubmit();return 0;} return t-1; });
    }, 1000);
    return ()=>clearInterval(iv);
  }, [quiz?.id, result]); // eslint-disable-line

  function setAnswer(qId: string, val: AnswerValue) {
    setAnswers(a=>({...a,[qId]:val}));
  }

  function isAnswered(q: Question): boolean {
    const a = answers[q.id];
    if (q.type === "ORDER_ITEMS")  return Array.isArray(a) && a.length === q.options.length;
    if (q.type === "FILL_BLANK")   return Array.isArray(a) && (a as string[]).some(x=>x.trim());
    if (q.type === "FREE_TEXT")    return typeof a === "string" && a.trim().length > 0;
    return typeof a === "string"   && a.length > 0;
  }

  async function handleSubmit() {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q=>!isAnswered(q));
    if (unanswered.length > 0) { toast.error(`Faltan ${unanswered.length} pregunta(s) por responder`); return; }
    setSubmitting(true);
    try {
      const payload = quiz.questions.map(q => {
        const a = answers[q.id];
        if (q.type==="ORDER_ITEMS") return { questionId:q.id, orderedIds: a as string[] };
        if (q.type==="FILL_BLANK")  return { questionId:q.id, filledAnswers: a as string[] };
        if (q.type==="FREE_TEXT")   return { questionId:q.id, freeText: a as string };
        return { questionId:q.id, selectedOptionId: a as string };
      });
      const res  = await fetch(`/api/lessons/${lessonId}/quiz`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({answers:payload})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (data.certificateIssued) toast.success("🎉 ¡Certificado emitido!");
    } catch (e:unknown) { toast.error(e instanceof Error ? e.message : "Error al enviar"); }
    finally { setSubmitting(false); }
  }

  function handleRetry() {
    setAnswers({}); setResult(null);
    setTimeLeft(quiz?.timeLimitMins ? quiz.timeLimitMins*60 : null);
    fetch(`/api/lessons/${lessonId}/quiz`).then(r=>r.json()).then(setQuiz);
  }

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-yelau-yellow" /></div>;
  if (!quiz||quiz.questions.length===0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-border rounded-lg">
      <HelpCircle className="w-10 h-10 text-muted-foreground/30" />
      <p className="font-semibold text-foreground">Este quiz aún no tiene preguntas</p>
    </div>
  );

  const answeredCount = quiz.questions.filter(isAnswered).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  /* ── Resultado ── */
  if (result) {
    const scoreColor = result.passed ? "text-green-500" : "text-red-500";
    const scoreBg    = result.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30";
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl border-2 p-8 text-center space-y-4 ${scoreBg}`}>
          <div className="flex justify-center">
            {result.passed ? <Trophy className="w-14 h-14 text-yelau-yellow" /> : <XCircle className="w-14 h-14 text-red-400" />}
          </div>
          <div>
            <p className={`text-5xl font-black ${scoreColor}`}>{result.score}%</p>
            <p className="text-xl font-bold text-foreground mt-2">{result.passed?"¡Aprobado!":"No aprobado"}</p>
            <p className="text-sm text-muted-foreground mt-1">{result.correct} de {result.total} correctas · Mínimo: {quiz.passingScore}%</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Revisión de respuestas</p>
          {quiz.questions.map((q,i)=>{
            const pqs = result.perQuestionScore?.[q.id] ?? 0;
            const isRight = pqs >= 0.5;
            const ca = result.correctAnswers[q.id];
            const myAns = answers[q.id];
            return (
              <div key={q.id} className={`rounded-xl border p-4 space-y-2 ${isRight?"border-green-500/30 bg-green-500/5":"border-red-500/30 bg-red-500/5"}`}>
                <div className="flex items-start gap-2">
                  {isRight?<CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"/>:<XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"/>}
                  <p className="text-sm font-medium text-foreground">{i+1}. {q.text.replace(/\[___\]/g,"___")}</p>
                </div>

                {(q.type==="MULTIPLE_CHOICE"||q.type==="TRUE_FALSE"||q.type==="IMAGE_CHOICE") && (
                  <div className="grid gap-1 pl-6">
                    {q.options.map(opt=>{
                      const isSel = opt.id === myAns;
                      const isCorr = opt.id === ca;
                      return (
                        <div key={opt.id} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${isCorr?"bg-green-500/20 text-green-700 font-semibold":isSel?"bg-red-500/20 text-red-600":"text-muted-foreground"}`}>
                          <span>{isCorr?"✓":isSel?"✗":"○"}</span>{opt.text}
                          {isCorr&&!isSel&&<span className="ml-auto text-green-600 text-[10px]">Correcta</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type==="ORDER_ITEMS" && (
                  <div className="pl-6 text-xs text-muted-foreground">
                    <span className="font-medium">Orden correcto: </span>
                    {(ca as string[]).map((id,i)=><span key={id}>{i>0?" → ":""}{q.options.find(o=>o.id===id)?.text}</span>)}
                  </div>
                )}

                {q.type==="FILL_BLANK" && (
                  <div className="pl-6 text-xs text-muted-foreground">
                    <span className="font-medium">Respuestas correctas: </span>{(ca as string[]).join(" / ")}
                  </div>
                )}

                {q.type==="FREE_TEXT" && (
                  <div className="pl-6 space-y-1 text-xs">
                    <p className="text-muted-foreground"><span className="font-medium">Tu respuesta: </span>{myAns as string}</p>
                    <p className="text-muted-foreground"><span className="font-medium">Puntuación IA: </span>{Math.round(pqs*100)}%</p>
                    {ca ? <p className="text-muted-foreground"><span className="font-medium">Respuesta modelo: </span>{String(ca)}</p> : null}
                  </div>
                )}

                {q.explanation && (
                  <p className="pl-6 text-[11px] text-blue-400 italic">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          {!result.passed && quiz.attemptsLeft > 1 && (
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />Intentar de nuevo ({quiz.attemptsLeft-1} restantes)
            </Button>
          )}
          {(result.passed||quiz.attemptsLeft<=1)&&nextLessonId&&(
            <Button onClick={()=>router.push(`/dashboard/courses/${courseId}/lessons/${nextLessonId}`)}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2">
              Siguiente lección <ChevronRight className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" onClick={()=>router.push(`/dashboard/courses/${courseId}`)}>Volver</Button>
        </div>
      </div>
    );
  }

  /* ── Quiz activo ── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-yelau-yellow" />Quiz — {quiz.questions.length} preguntas
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Mínimo: {quiz.passingScore}% · {quiz.attemptsLeft} intento(s)</p>
        </div>
        {timeLeft!==null&&(
          <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timeLeft<60?"text-red-400":"text-foreground"}`}>
            <Clock className="w-4 h-4" />{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answeredCount} de {quiz.questions.length} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="space-y-5">
        {quiz.questions.map((q,i)=>{
          const answered = isAnswered(q);
          return (
            <div key={q.id} className={`rounded-xl border p-5 space-y-3 transition-colors ${answered?"border-yelau-yellow/30 bg-yelau-yellow/5":"border-border"}`}>
              <div className="flex items-start gap-2">
                <span className="text-yelau-yellow font-bold text-sm flex-shrink-0">{i+1}.</span>
                <p className="text-sm font-semibold text-foreground flex-1">
                  {q.type==="FILL_BLANK" ? q.text.replace(/\[___\]/g,"___") : q.text}
                </p>
                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize flex-shrink-0">
                  {q.type==="MULTIPLE_CHOICE"?"Múltiple":q.type==="TRUE_FALSE"?"V/F":q.type==="ORDER_ITEMS"?"Ordenar":q.type==="FILL_BLANK"?"Huecos":q.type==="FREE_TEXT"?"Libre":"Imagen"}
                </span>
              </div>

              {q.type==="MULTIPLE_CHOICE"&&<MCQuestion q={q} answer={(answers[q.id] as string)??""} onAnswer={v=>setAnswer(q.id,v)}/>}
              {q.type==="IMAGE_CHOICE"   &&<MCQuestion q={q} answer={(answers[q.id] as string)??""} onAnswer={v=>setAnswer(q.id,v)}/>}
              {q.type==="TRUE_FALSE"     &&<TFQuestion q={q} answer={(answers[q.id] as string)??""} onAnswer={v=>setAnswer(q.id,v)}/>}
              {q.type==="ORDER_ITEMS"    &&<OrderQuestion q={q} answer={(answers[q.id] as string[])||(q.options.map(o=>o.id))} onAnswer={v=>setAnswer(q.id,v)}/>}
              {q.type==="FILL_BLANK"     &&<FillBlankQuestion q={q} answer={(answers[q.id] as string[])||[]} onAnswer={v=>setAnswer(q.id,v)}/>}
              {q.type==="FREE_TEXT"      &&<FreeTextQuestion q={q} answer={(answers[q.id] as string)||""} onAnswer={v=>setAnswer(q.id,v)}/>}
            </div>
          );
        })}
      </div>

      {answeredCount < quiz.questions.length && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Quedan {quiz.questions.length-answeredCount} pregunta(s) sin responder
        </div>
      )}

      <Button onClick={handleSubmit} disabled={submitting||answeredCount<quiz.questions.length}
        className="w-full h-12 bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 text-base">
        {submitting?<><Loader2 className="w-5 h-5 animate-spin"/>Evaluando…</>:<>Enviar respuestas <ChevronRight className="w-5 h-5"/></>}
      </Button>
    </div>
  );
}
