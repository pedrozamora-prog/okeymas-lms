"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ChevronDown, ChevronRight, BookOpen,
  CheckCircle2, Loader2, ArrowLeft, Wand2, ListChecks, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Types ──────────────────────────────────────────────────────────────── */
interface QuizQuestion {
  text: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
}
interface GeneratedLesson {
  title: string;
  description?: string;
  content?: Array<Record<string, unknown>>;
}
interface GeneratedModule {
  title: string;
  description?: string;
  lessons: GeneratedLesson[];
  quiz?: QuizQuestion[];
}
interface GeneratedCourse {
  title: string;
  description: string;
  modules: GeneratedModule[];
}

/* ── Step indicator ─────────────────────────────────────────────────────── */
function StepDot({ n, current, label }: { n: number; current: number; label: string }) {
  const done    = current > n;
  const active  = current === n;
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
        done   ? "bg-primary text-yelau-black" :
        active ? "bg-primary/20 text-primary border-2 border-primary" :
                 "bg-muted text-muted-foreground"
      )}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </div>
      <span className={cn(
        "text-sm hidden sm:block",
        active ? "text-foreground font-semibold" : "text-muted-foreground"
      )}>{label}</span>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function AiGeneratePage() {
  const router = useRouter();

  /* Step 1 state */
  const [topic,            setTopic]            = useState("");
  const [context,          setContext]          = useState("");
  const [numModules,       setNumModules]       = useState(3);
  const [lessonsPerModule, setLessonsPerModule] = useState(3);
  const [includeContent,   setIncludeContent]   = useState(true);
  const [includeQuiz,      setIncludeQuiz]      = useState(true);

  /* Wizard state */
  const [step,         setStep]         = useState(1);
  const [generating,   setGenerating]   = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [course,       setCourse]       = useState<GeneratedCourse | null>(null);
  const [expandedMods, setExpandedMods] = useState<Set<number>>(new Set([0]));

  /* ── Step 1: Generate ── */
  async function handleGenerate() {
    if (!topic.trim()) { toast.error("Escribe el tema del curso"); return; }
    setGenerating(true);
    try {
      const res  = await fetch("/api/ai/generate-course", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic, context, numModules, lessonsPerModule, includeContent, includeQuiz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setCourse(data.course);
      setStep(2);
      setExpandedMods(new Set([0]));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generando el curso");
    } finally {
      setGenerating(false);
    }
  }

  /* ── Step 2: Create in DB ── */
  async function handleCreate() {
    if (!course) return;
    setCreating(true);
    try {
      const res  = await fetch("/api/ai/create-course", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ course }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error creando el curso");
      toast.success("¡Curso creado! Redirigiendo al editor…");
      router.push(`/admin/courses/${data.courseId}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creando el curso");
      setCreating(false);
    }
  }

  function toggleMod(i: number) {
    setExpandedMods(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  /* ── Stats ── */
  const totalLessons = course?.modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0) ?? 0;
  const totalQuiz    = course?.modules.reduce((s, m) => s + (m.quiz?.length ?? 0), 0) ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => step === 2 ? setStep(1) : router.push("/admin/courses")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {step === 2 ? "Volver a configuración" : "Volver a cursos"}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Generador de cursos IA</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Describe el tema y la IA crea el curso completo en segundos
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3">
        <StepDot n={1} current={step} label="Configura" />
        <div className="flex-1 h-px bg-border" />
        <StepDot n={2} current={step} label="Revisa y crea" />
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* Topic */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Tema del curso <span className="text-primary">*</span>
            </Label>
            <Input
              placeholder="Ej: Atención al cliente en recepción de gimnasios"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="h-11"
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
            />
            <p className="text-xs text-muted-foreground">
              Sé específico para obtener contenido más relevante y aplicable.
            </p>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <textarea
              placeholder="Ej: Para personal de recepción con menos de 1 año de experiencia. Incluir protocolos de apertura y cierre, manejo de quejas y venta de membresías."
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Structure */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Número de módulos</Label>
              <select
                value={numModules}
                onChange={e => setNumModules(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {[2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} módulos</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Lecciones por módulo</Label>
              <select
                value={lessonsPerModule}
                onChange={e => setLessonsPerModule(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {[2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} lecciones</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setIncludeContent(v => !v)}
                className={cn(
                  "w-10 h-5.5 rounded-full transition-all relative flex items-center cursor-pointer border-2",
                  includeContent ? "bg-primary border-primary" : "bg-muted border-border"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full bg-white absolute transition-all shadow-sm",
                  includeContent ? "left-[18px]" : "left-0.5"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Generar contenido completo por lección
                </p>
                <p className="text-xs text-muted-foreground">Párrafos, encabezados y consejos en cada lección</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setIncludeQuiz(v => !v)}
                className={cn(
                  "w-10 h-5.5 rounded-full transition-all relative flex items-center cursor-pointer border-2",
                  includeQuiz ? "bg-primary border-primary" : "bg-muted border-border"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full bg-white absolute transition-all shadow-sm",
                  includeQuiz ? "left-[18px]" : "left-0.5"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-primary" />
                  Generar quiz por módulo
                </p>
                <p className="text-xs text-muted-foreground">Lección de evaluación al final de cada módulo</p>
              </div>
            </label>
          </div>

          {/* Estimate */}
          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>
              Se generarán <strong className="text-foreground">{numModules} módulos</strong>{" "}
              con <strong className="text-foreground">{numModules * lessonsPerModule} lecciones</strong>
              {includeQuiz && <> y <strong className="text-foreground">{numModules} quiz</strong></>}.
              {" "}Tiempo estimado: <strong className="text-foreground">15-30 segundos</strong>.
            </span>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full h-12 bg-primary text-yelau-black hover:bg-primary/90 font-bold text-base"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando curso con IA…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generar curso
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── STEP 2: Preview ── */}
      {step === 2 && course && (
        <div className="space-y-4">
          {/* Cover image preview */}
          <div className="rounded-2xl overflow-hidden border border-border bg-card aspect-[1200/630] w-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/og/course-cover?${new URLSearchParams({ title: course.title, org: "", topic: course.title }).toString()}`}
              alt="Portada del curso"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                Portada generada
              </span>
            </div>
          </div>

          {/* Course header card */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <input
                  value={course.title}
                  onChange={e => setCourse(c => c ? { ...c, title: e.target.value } : c)}
                  className="w-full text-xl font-black text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none pb-0.5 transition-colors"
                />
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0 text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
                Borrador
              </Badge>
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {course.modules.length} módulos
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {totalLessons} lecciones
              </span>
              {totalQuiz > 0 && (
                <span className="flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" />
                  {totalQuiz} preguntas de quiz
                </span>
              )}
            </div>
          </div>

          {/* Modules accordion */}
          <div className="space-y-2">
            {course.modules.map((mod, mi) => (
              <div key={mi} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleMod(mi)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{mi + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-snug">{mod.title}</p>
                    {mod.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mod.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {mod.lessons?.length ?? 0} lec.{(mod.quiz?.length ?? 0) > 0 ? " · quiz" : ""}
                    </span>
                    {expandedMods.has(mi)
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {expandedMods.has(mi) && (
                  <div className="border-t border-border divide-y divide-border">
                    {(mod.lessons ?? []).map((lesson, li) => (
                      <div key={li} className="flex items-start gap-3 px-4 py-3 bg-muted/20">
                        <div className="w-5 h-5 rounded border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{lesson.description}</p>
                          )}
                          {(lesson.content ?? []).length > 0 && (
                            <p className="text-xs text-primary/70 mt-1">
                              {lesson.content!.length} bloques de contenido
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Quiz lesson indicator */}
                    {(mod.quiz ?? []).length > 0 && (
                      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5">
                        <div className="w-5 h-5 rounded border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ListChecks className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">Evaluación: {mod.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {mod.quiz!.length} preguntas · puntuación mínima 70%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>
              El curso se creará como <strong className="text-foreground">borrador</strong>. Podrás editar todo el contenido, añadir vídeos e imágenes, y publicarlo cuando esté listo.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setStep(1); setCourse(null); }}
              className="flex-1"
              disabled={creating}
            >
              Regenerar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 h-11 bg-primary text-yelau-black hover:bg-primary/90 font-bold"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando curso…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Crear curso
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
