"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { LessonBlockEditor } from "@/components/admin/lesson-block-editor";
import { BlockRenderer } from "@/components/lesson/block-renderer";
import { Block } from "@/lib/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, Eye, Pencil, Loader2,
  BookOpen, Clock, CheckCircle2, Sparkles,
  ChevronDown, ChevronUp, Plus, ExternalLink,
  Mic, Trash2, Volume2, Package, UploadCloud, FileCheck2, XCircle,
} from "lucide-react";
import Link from "next/link";

interface LessonData {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  isRequired: boolean;
  videoUrl: string | null;
  fileUrl: string | null;
  audioNarrationUrl: string | null;
  content: Block[] | null;
  moduleId: string;
  module: { title: string; courseId: string; course: { title: string } };
}

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "Femenina", style: "Calmada"       },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "Masculina", style: "Profesional"  },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella",  gender: "Femenina", style: "Suave"         },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh",   gender: "Masculina", style: "Profunda"     },
];

function extractNarrationText(blocks: Block[]): string {
  return (blocks as Array<Record<string, unknown>>)
    .map(b => {
      if (b.type === "heading")   return String(b.text ?? "");
      if (b.type === "paragraph") return String(b.text ?? "");
      if (b.type === "callout")   return String(b.text ?? "");
      if (b.type === "list") {
        const items = (b.items as string[] | undefined) ?? [];
        return items.join(". ");
      }
      return "";
    })
    .filter(Boolean)
    .join(". ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);
}

interface GeneratedQuestion {
  question:    string;
  options:     string[];
  correct:     number;
  explanation?: string;
}

function extractTextFromBlocks(blocks: Block[]): string {
  return (blocks as Array<Record<string, unknown>>)
    .map(b => {
      if (b.type === "heading")   return `## ${b.text ?? ""}`;
      if (b.type === "paragraph") return String(b.text ?? "");
      if (b.type === "callout")   return String(b.text ?? "");
      if (b.type === "list") {
        const items = (b.items as string[] | undefined) ?? [];
        return items.join("\n");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 3000);
}

export default function LessonEditorPage() {
  const params   = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson,  setLesson]  = useState<LessonData | null>(null);
  const [blocks,  setBlocks]  = useState<Block[]>([]);
  const [title,   setTitle]   = useState("");
  const [duration, setDuration] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  // Audio IA state
  const [selectedVoice,   setSelectedVoice]   = useState(VOICES[0].id);
  const [audioLoading,    setAudioLoading]    = useState(false);
  const [audioUrl,        setAudioUrl]        = useState<string | null>(null);
  const [deletingAudio,   setDeletingAudio]   = useState(false);

  // SCORM upload state
  const [scormFile,        setScormFile]        = useState<File | null>(null);
  const [scormUploading,   setScormUploading]   = useState(false);
  const [scormResult,      setScormResult]      = useState<{ launchFile: string; title: string; filesUploaded: number } | null>(null);
  const [scormRemoving,    setScormRemoving]    = useState(false);

  // Quiz IA state
  const [numQuestions,   setNumQuestions]   = useState(5);
  const [quizLoading,    setQuizLoading]    = useState(false);
  const [generatedQs,    setGeneratedQs]    = useState<GeneratedQuestion[] | null>(null);
  const [expandedQ,      setExpandedQ]      = useState<number | null>(null);
  const [passingScore,   setPassingScore]   = useState(70);
  const [maxAttempts,    setMaxAttempts]    = useState(3);
  const [creatingQuiz,   setCreatingQuiz]   = useState(false);
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);

  const fetchLesson = useCallback(async () => {
    try {
      const res  = await fetch(`/api/admin/lessons/${lessonId}`);
      const data = await res.json() as LessonData;
      setLesson(data);
      setTitle(data.title);
      setDuration(data.duration?.toString() ?? "");
      setBlocks((data.content as Block[]) ?? []);
      setAudioUrl(data.audioNarrationUrl ?? null);
    } catch {
      toast.error("Error al cargar la lección");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  async function generateQuiz() {
    if (blocks.length === 0) {
      toast.error("Añade contenido a la lección antes de generar el quiz");
      return;
    }
    setQuizLoading(true);
    setGeneratedQs(null);
    try {
      const contentText = extractTextFromBlocks(blocks);
      const res = await fetch("/api/ai/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type:         "quiz",
          lessonTitle:  title,
          moduleTitle:  lesson?.module.title ?? "",
          contentText,
          numQuestions,
        }),
      });
      const data = await res.json();
      if (!data.text) throw new Error(data.error ?? "Sin respuesta");
      // Extract JSON array even if model adds surrounding text
      const jsonMatch = data.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("La IA no devolvió el formato esperado. Inténtalo de nuevo.");
      const parsed = JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
      setGeneratedQs(parsed);
      setExpandedQ(0);
      toast.success(`${parsed.length} preguntas generadas — revísalas y crea la lección`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar quiz");
    } finally {
      setQuizLoading(false);
    }
  }

  async function createQuizLesson() {
    if (!generatedQs || !lesson) return;
    setCreatingQuiz(true);
    try {
      // 1. Create the QUIZ lesson in the same module
      const lessonRes = await fetch(`/api/admin/modules/${lesson.moduleId}/lessons`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:      `Quiz: ${title}`,
          type:       "QUIZ",
          isRequired: true,
        }),
      });
      if (!lessonRes.ok) throw new Error("No se pudo crear la lección quiz");
      const newLesson = await lessonRes.json() as { id: string };

      // 2. Save the questions
      const quizRes = await fetch(`/api/admin/lessons/${newLesson.id}/quiz`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          passingScore,
          maxAttempts,
          questions: generatedQs.map(q => ({
            text:        q.question,
            type:        "MULTIPLE_CHOICE",
            explanation: q.explanation ?? null,
            options:     q.options.map((opt, i) => ({
              text:      opt,
              isCorrect: i === q.correct,
            })),
          })),
        }),
      });
      if (!quizRes.ok) throw new Error("No se pudieron guardar las preguntas");

      setCreatedLessonId(newLesson.id);
      toast.success("¡Lección quiz creada con éxito!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear quiz");
    } finally {
      setCreatingQuiz(false);
    }
  }

  async function generateNarration() {
    if (blocks.length === 0) {
      toast.error("Añade contenido a la lección antes de narrar");
      return;
    }
    setAudioLoading(true);
    try {
      const text = extractNarrationText(blocks);
      const res  = await fetch("/api/ai/narrate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ lessonId, text, voiceId: selectedVoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setAudioUrl(data.audioUrl);
      toast.success("¡Narración generada y guardada en la lección!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar narración");
    } finally {
      setAudioLoading(false);
    }
  }

  async function deleteNarration() {
    setDeletingAudio(true);
    try {
      const res = await fetch("/api/ai/narrate", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ lessonId }),
      });
      if (!res.ok) throw new Error();
      setAudioUrl(null);
      toast.success("Narración eliminada");
    } catch {
      toast.error("Error al eliminar narración");
    } finally {
      setDeletingAudio(false);
    }
  }

  async function uploadScorm() {
    if (!scormFile) return;
    setScormUploading(true);
    try {
      const fd = new FormData();
      fd.append("package", scormFile);
      const res = await fetch(`/api/admin/scorm/${lessonId}/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir el paquete");
      setScormResult(data);
      setLesson(prev => prev ? { ...prev, type: "SCORM", fileUrl: `${lessonId}/${data.launchFile}` } : prev);
      toast.success(`Paquete SCORM subido: ${data.filesUploaded} archivos`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setScormUploading(false);
    }
  }

  async function removeScorm() {
    setScormRemoving(true);
    try {
      const res = await fetch(`/api/admin/scorm/${lessonId}/upload`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setScormResult(null);
      setScormFile(null);
      setLesson(prev => prev ? { ...prev, type: "CONTENT", fileUrl: null } : prev);
      toast.success("Paquete SCORM eliminado");
    } catch {
      toast.error("Error al eliminar el paquete");
    } finally {
      setScormRemoving(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:    title.trim(),
          duration: duration ? Number(duration) : null,
          content:  blocks,
          type:     "CONTENT",
        }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      toast.success("Lección guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={`/admin/courses/${courseId}/edit`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <Input
            className="h-8 text-sm font-semibold border-none bg-transparent px-1 focus-visible:ring-0 focus-visible:bg-muted/30 rounded"
            value={title}
            onChange={e => { setTitle(e.target.value); setDirty(true); }}
            placeholder="Título de la lección"
          />
          <p className="text-[11px] text-muted-foreground px-1 mt-0.5">
            {lesson.module.course.title} / {lesson.module.title}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="h-7 w-16 text-xs text-center"
              type="number"
              min={1}
              placeholder="min"
              value={duration}
              onChange={e => { setDuration(e.target.value); setDirty(true); }}
            />
          </div>

          {dirty && <Badge variant="outline" className="text-amber-500 border-amber-500/50 text-[10px]">Sin guardar</Badge>}

          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5 h-8">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </Button>
        </div>
      </div>

      {/* Editor / Preview tabs */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Tabs defaultValue="editor">
          <TabsList className="mb-6">
            <TabsTrigger value="editor" className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Vista previa
            </TabsTrigger>
            <TabsTrigger value="quiz-ia" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quiz IA
            </TabsTrigger>
            <TabsTrigger value="audio-ia" className="gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Audio IA
            </TabsTrigger>
            <TabsTrigger value="scorm" className="gap-1.5">
              <Package className="w-3.5 h-3.5" />
              SCORM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <LessonBlockEditor
              initialBlocks={blocks}
              onChange={b => { setBlocks(b); setDirty(true); }}
            />
          </TabsContent>

          <TabsContent value="quiz-ia" className="space-y-6">
            {/* Config */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Generar quiz desde el contenido</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                La IA leerá el contenido de esta lección y generará preguntas relevantes. Guarda la lección antes de generar si tienes cambios pendientes.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Nº preguntas</label>
                  <select
                    value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    className="h-8 rounded-md border border-border bg-background text-sm px-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {[3, 5, 7, 10].map(n => (
                      <option key={n} value={n}>{n} preguntas</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={generateQuiz}
                  disabled={quizLoading || blocks.length === 0}
                  size="sm"
                  className="gap-1.5"
                >
                  {quizLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Generar preguntas</>
                  }
                </Button>

                {blocks.length === 0 && (
                  <p className="text-xs text-amber-500">Añade contenido en el Editor primero</p>
                )}
              </div>
            </div>

            {/* Generated questions preview */}
            {generatedQs && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {generatedQs.length} preguntas generadas — revísalas antes de crear la lección
                </p>

                {generatedQs.map((q, qi) => (
                  <div key={qi} className="rounded-lg border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {qi + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground line-clamp-2">{q.question}</span>
                      {expandedQ === qi
                        ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      }
                    </button>

                    {expandedQ === qi && (
                      <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${
                            oi === q.correct
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "text-muted-foreground"
                          }`}>
                            <span className="font-mono text-xs font-bold w-4">{["A","B","C","D"][oi]}</span>
                            {opt}
                            {oi === q.correct && <Badge className="ml-auto text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Correcta</Badge>}
                          </div>
                        ))}
                        {q.explanation && (
                          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-3">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Create quiz lesson config */}
                {!createdLessonId ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                    <h4 className="text-sm font-semibold">Configuración del quiz</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Nota mínima (%)</label>
                        <Input
                          type="number"
                          min={0} max={100}
                          value={passingScore}
                          onChange={e => setPassingScore(Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Intentos máximos</label>
                        <Input
                          type="number"
                          min={1} max={10}
                          value={maxAttempts}
                          onChange={e => setMaxAttempts(Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={createQuizLesson}
                      disabled={creatingQuiz}
                      className="w-full gap-2"
                    >
                      {creatingQuiz
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando lección quiz…</>
                        : <><Plus className="w-4 h-4" /> Crear lección quiz en este módulo</>
                      }
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">¡Lección quiz creada!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Se añadió al módulo con {generatedQs.length} preguntas.</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/courses/${courseId}/edit`} className="gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver curso
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio-ia" className="space-y-6">
            {/* Config */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Narrar lección con IA</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                ElevenLabs convierte el texto de la lección en audio narrado. La narración se guarda automáticamente y el alumno podrá escucharla.
              </p>

              {/* Character count */}
              {blocks.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">
                    {extractNarrationText(blocks).length} / 2500 caracteres
                  </span>
                  <span>aprox. {Math.ceil(extractNarrationText(blocks).length / 150)} segundos de audio</span>
                </div>
              )}

              {/* Voice selector */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Voz</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VOICES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        selectedVoice === v.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/80 hover:bg-muted/30"
                      }`}
                    >
                      <p className="text-sm font-semibold">{v.name}</p>
                      <p className="text-[11px] text-muted-foreground">{v.gender} · {v.style}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateNarration}
                disabled={audioLoading || blocks.length === 0}
                className="gap-2"
              >
                {audioLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando narración…</>
                  : <><Mic className="w-4 h-4" /> {audioUrl ? "Regenerar narración" : "Generar narración"}</>
                }
              </Button>
              {blocks.length === 0 && (
                <p className="text-xs text-amber-500">Añade contenido en el Editor primero</p>
              )}
            </div>

            {/* Current audio */}
            {audioUrl && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Narración activa</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 text-xs"
                    onClick={deleteNarration}
                    disabled={deletingAudio}
                  >
                    {deletingAudio
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />
                    }
                    Eliminar
                  </Button>
                </div>
                <audio controls src={audioUrl} className="w-full h-10 accent-primary" />
                <p className="text-xs text-muted-foreground">
                  Los alumnos verán un reproductor de audio en la parte superior de esta lección.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scorm" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Paquete SCORM 1.2</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Sube un ZIP exportado desde Articulate Storyline, Rise, iSpring, Adobe Captivate u otras herramientas de autoría SCORM 1.2.
                El paquete debe incluir <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px]">imsmanifest.xml</code> en la raíz.
              </p>

              {/* Already has SCORM package */}
              {(lesson?.type === "SCORM" && lesson?.fileUrl) ? (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Paquete SCORM activo</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{lesson.fileUrl}</p>
                    </div>
                  </div>
                  {scormResult && (
                    <p className="text-xs text-muted-foreground">
                      {scormResult.filesUploaded} archivos · lanzamiento: <code className="bg-muted px-1 rounded font-mono text-[10px]">{scormResult.launchFile}</code>
                    </p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeScorm}
                    disabled={scormRemoving}
                    className="gap-1.5"
                  >
                    {scormRemoving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <XCircle className="w-3.5 h-3.5" />
                    }
                    Eliminar paquete
                  </Button>
                </div>
              ) : (
                /* Upload form */
                <div className="space-y-3">
                  <label
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                      scormFile
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={e => setScormFile(e.target.files?.[0] ?? null)}
                      disabled={scormUploading}
                    />
                    <UploadCloud className={`w-8 h-8 ${scormFile ? "text-primary" : "text-muted-foreground/40"}`} />
                    {scormFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">{scormFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(scormFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-foreground">Haz clic para seleccionar el ZIP</p>
                        <p className="text-xs text-muted-foreground">o arrastra y suelta aquí · máx. 200 MB</p>
                      </div>
                    )}
                  </label>

                  {scormFile && (
                    <Button
                      onClick={uploadScorm}
                      disabled={scormUploading}
                      className="w-full gap-2"
                    >
                      {scormUploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo y procesando…</>
                        : <><UploadCloud className="w-4 h-4" /> Subir paquete SCORM</>
                      }
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">¿Cómo funciona?</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Los archivos se sirven desde el mismo dominio para cumplir con SCORM 1.2 (<code className="font-mono text-[10px] bg-muted px-0.5 rounded">window.parent.API</code>).</li>
                <li>El progreso, puntuación y estado (<code className="font-mono text-[10px] bg-muted px-0.5 rounded">lesson_status</code>) se guardan automáticamente.</li>
                <li>Cuando el paquete reporta <code className="font-mono text-[10px] bg-muted px-0.5 rounded">passed</code> o <code className="font-mono text-[10px] bg-muted px-0.5 rounded">completed</code>, la lección se marca como completada.</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border rounded-xl text-muted-foreground">
                <BookOpen className="w-8 h-8 opacity-30" />
                <p className="text-sm">Sin contenido. Añade bloques en el editor.</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="mb-6">
                  <h1 className="text-2xl font-black text-foreground">{title || "Sin título"}</h1>
                  {duration && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" /> {duration} minutos
                    </p>
                  )}
                </div>
                <BlockRenderer blocks={blocks} />
                <div className="mt-8 pt-6 border-t border-border flex justify-center">
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como completada
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
