"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoUploader } from "@/components/admin/video-uploader";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Loader2,
  Video, FileText, HelpCircle, Radio, Layers, Pencil, Save, X, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LessonType = "VIDEO" | "PDF" | "QUIZ" | "LIVE_CLASS" | "SCORM";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: LessonType;
  videoUrl: string | null;
  fileUrl: string | null;
  duration: number | null;
  isRequired: boolean;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

const lessonTypeIcon: Record<LessonType, React.ReactNode> = {
  VIDEO:      <Video      className="w-3.5 h-3.5" />,
  PDF:        <FileText   className="w-3.5 h-3.5" />,
  QUIZ:       <HelpCircle className="w-3.5 h-3.5" />,
  LIVE_CLASS: <Radio      className="w-3.5 h-3.5" />,
  SCORM:      <Layers     className="w-3.5 h-3.5" />,
};
const lessonTypeLabel: Record<LessonType, string> = {
  VIDEO: "Vídeo", PDF: "PDF", QUIZ: "Quiz", LIVE_CLASS: "Directo", SCORM: "SCORM",
};

export function ModuleEditor({ courseId, initialModules }: { courseId: string; initialModules: Module[] }) {
  const [modules, setModules]     = useState<Module[]>(initialModules);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set(initialModules.map(m => m.id)));
  const [addingModule, setAdding] = useState(false);
  const [newModTitle, setNewModT] = useState("");
  const [savingMod, setSavingMod] = useState(false);

  // ── Add module ────────────────────────────────────────────────────────────
  async function handleAddModule() {
    if (!newModTitle.trim()) { toast.error("Escribe un título para el módulo"); return; }
    setSavingMod(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModTitle }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const mod: Module = await res.json();
      setModules(prev => [...prev, mod]);
      setExpanded(prev => new Set([...prev, mod.id]));
      setNewModT("");
      setAdding(false);
      toast.success("Módulo añadido");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al crear módulo");
    } finally {
      setSavingMod(false);
    }
  }

  // ── Delete module ─────────────────────────────────────────────────────────
  async function handleDeleteModule(modId: string) {
    if (!confirm("¿Eliminar este módulo y todas sus lecciones?")) return;
    try {
      const res = await fetch(`/api/admin/modules/${modId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setModules(prev => prev.filter(m => m.id !== modId));
      toast.success("Módulo eliminado");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  // ── Add lesson ────────────────────────────────────────────────────────────
  async function handleAddLesson(modId: string, data: { title: string; description?: string; type: LessonType; videoUrl?: string; fileUrl?: string; duration?: string }) {
    const res = await fetch(`/api/admin/modules/${modId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const lesson: Lesson = await res.json();
    setModules(prev => prev.map(m =>
      m.id === modId ? { ...m, lessons: [...m.lessons, lesson] } : m
    ));
    toast.success("Lección añadida");
  }

  // ── Update lesson ─────────────────────────────────────────────────────────
  async function handleUpdateLesson(modId: string, lessonId: string, data: Partial<Lesson>) {
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Lesson = await res.json();
      setModules(prev => prev.map(m =>
        m.id === modId
          ? { ...m, lessons: m.lessons.map(l => l.id === lessonId ? updated : l) }
          : m
      ));
      toast.success("Lección actualizada");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  // ── Delete lesson ─────────────────────────────────────────────────────────
  async function handleDeleteLesson(modId: string, lessonId: string) {
    if (!confirm("¿Eliminar esta lección?")) return;
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setModules(prev => prev.map(m =>
        m.id === modId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
      ));
      toast.success("Lección eliminada");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="space-y-3">
      {modules.length === 0 && !addingModule && (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">Este curso no tiene módulos todavía.</p>
          <p className="text-xs text-muted-foreground mt-1">Añade el primer módulo para empezar.</p>
        </div>
      )}

      {modules.map((mod, idx) => (
        <ModuleCard
          key={mod.id}
          mod={mod}
          idx={idx}
          expanded={expanded.has(mod.id)}
          onToggle={() => toggle(mod.id)}
          onDelete={() => handleDeleteModule(mod.id)}
          onAddLesson={(data) => handleAddLesson(mod.id, data)}
          onDeleteLesson={(lessonId) => handleDeleteLesson(mod.id, lessonId)}
          onUpdateLesson={(lessonId, data) => handleUpdateLesson(mod.id, lessonId, data)}
        />
      ))}

      {/* Añadir módulo */}
      {addingModule ? (
        <Card className="border-yelau-yellow/30 bg-yelau-yellow/5">
          <CardContent className="pt-4 pb-4 space-y-3">
            <Label className="text-sm font-semibold">Título del módulo</Label>
            <div className="flex gap-2">
              <Input
                value={newModTitle}
                onChange={e => setNewModT(e.target.value)}
                placeholder="Ej: Introducción al curso"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleAddModule()}
              />
              <Button
                onClick={handleAddModule}
                disabled={savingMod}
                className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold flex-shrink-0"
              >
                {savingMod ? <Loader2 className="w-4 h-4 animate-spin" /> : "Añadir"}
              </Button>
              <Button variant="ghost" onClick={() => { setAdding(false); setNewModT(""); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="w-full border-dashed gap-2"
        >
          <Plus className="w-4 h-4" />
          Añadir módulo
        </Button>
      )}
    </div>
  );
}

// ── Sub-component: individual module card ────────────────────────────────────

function ModuleCard({ mod, idx, expanded, onToggle, onDelete, onAddLesson, onDeleteLesson, onUpdateLesson }: {
  mod: Module;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddLesson: (data: { title: string; description?: string; type: LessonType; videoUrl?: string; fileUrl?: string; duration?: string }) => Promise<void>;
  onDeleteLesson: (id: string) => void;
  onUpdateLesson: (lessonId: string, data: Partial<Lesson>) => void;
}) {
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle]   = useState("");
  const [lessonDesc, setLessonDesc]     = useState("");
  const [lessonType, setLessonType]     = useState<LessonType>("VIDEO");
  const [lessonUrl, setLessonUrl]       = useState("");
  const [lessonDuration, setDuration]   = useState("");
  const [saving, setSaving]             = useState(false);
  const [videoMode, setVideoMode]       = useState<"upload" | "url">("upload");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [aiObjectives, setAiObjectives] = useState<string | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiDescLoading, setAiDescLoading] = useState(false);

  async function generateObjectives() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "objectives", moduleTitle: mod.title, courseTitle: "" }),
      });
      const data = await res.json();
      if (data.text) setAiObjectives(data.text);
      else toast.error("Error al generar objetivos");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setAiLoading(false);
    }
  }

  async function generateLessonDesc() {
    if (!lessonTitle.trim()) { toast.error("Escribe primero el título de la lección"); return; }
    setAiDescLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lessonDescription", lessonTitle, moduleTitle: mod.title, courseTitle: "" }),
      });
      const data = await res.json();
      if (data.text) setLessonDesc(data.text);
      else toast.error(data.error ?? "Error al generar descripción");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setAiDescLoading(false);
    }
  }

  async function submitLesson() {
    if (!lessonTitle.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    try {
      await onAddLesson({
        title: lessonTitle,
        description: lessonDesc || undefined,
        type: lessonType,
        videoUrl:  lessonType === "VIDEO" ? lessonUrl : undefined,
        fileUrl:   lessonType === "PDF"   ? lessonUrl : undefined,
        duration:  lessonDuration || undefined,
      });
      setLessonTitle(""); setLessonDesc(""); setLessonUrl(""); setDuration(""); setLessonType("VIDEO");
      setAddingLesson(false);
    } finally {
      setSaving(false);
    }
  }

  const urlLabel: Record<string, string> = {
    PDF:   "URL del PDF",
    SCORM: "URL del paquete SCORM",
  };

  return (
    <Card className="overflow-hidden">
      {/* Module header */}
      <CardHeader className="py-0 px-0">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        >
          {expanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          }
          <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">
            M{idx + 1}
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">{mod.title}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0 mr-2">
            {mod.lessons.length} lecciones
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-2">

          {/* IA: objetivos del módulo */}
          <div className="flex items-center justify-between pb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Lecciones</p>
            <button
              type="button"
              onClick={generateObjectives}
              disabled={aiLoading}
              className="flex items-center gap-1 text-[10px] text-yelau-yellow hover:text-yelau-yellow/80 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Objetivos con IA
            </button>
          </div>

          {aiObjectives && (
            <div className="rounded-lg border border-yelau-yellow/20 bg-yelau-yellow/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-yelau-yellow uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Objetivos generados
                </p>
                <button onClick={() => setAiObjectives(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <ul className="space-y-1">
                {aiObjectives.split("\n").filter(Boolean).map((obj, i) => (
                  <li key={i} className="text-xs text-foreground flex gap-2">
                    <span className="text-yelau-yellow mt-0.5 flex-shrink-0">•</span>
                    <span>{obj.replace(/^[-•]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lesson list */}
          {mod.lessons.map((lesson, li) => (
            <div key={lesson.id}>
              {editingLessonId === lesson.id ? (
                <LessonEditForm
                  lesson={lesson}
                  moduleTitle={mod.title}
                  onSave={(data) => {
                    onUpdateLesson(lesson.id, data);
                    setEditingLessonId(null);
                  }}
                  onCancel={() => setEditingLessonId(null)}
                />
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/50 hover:border-yelau-yellow/20 transition-colors">
                  <span className="text-xs text-muted-foreground w-4 flex-shrink-0">{li + 1}</span>
                  <span className={cn(
                    "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0",
                    lesson.type === "VIDEO"      && "bg-blue-500/10 text-blue-400",
                    lesson.type === "PDF"        && "bg-orange-500/10 text-orange-400",
                    lesson.type === "QUIZ"       && "bg-purple-500/10 text-purple-400",
                    lesson.type === "LIVE_CLASS" && "bg-red-500/10 text-red-400",
                    lesson.type === "SCORM"      && "bg-cyan-500/10 text-cyan-400",
                  )}>
                    {lessonTypeIcon[lesson.type]}
                    {lessonTypeLabel[lesson.type]}
                  </span>
                  <span className="flex-1 text-sm text-foreground truncate">{lesson.title}</span>
                  {lesson.duration && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">{lesson.duration}min</span>
                  )}
                  <button
                    onClick={() => setEditingLessonId(lesson.id)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Editar lección"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteLesson(lesson.id)}
                    className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors flex-shrink-0"
                    title="Eliminar lección"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add lesson form */}
          {addingLesson ? (
            <div className="mt-3 p-4 rounded-lg border border-yelau-yellow/30 bg-yelau-yellow/5 space-y-3">
              <p className="text-xs font-semibold text-foreground">Nueva lección</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    placeholder="Título de la lección"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={lessonType} onValueChange={v => { setLessonType(v as LessonType); setLessonUrl(""); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Vídeo</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="QUIZ">Quiz</SelectItem>
                      <SelectItem value="LIVE_CLASS">Directo</SelectItem>
                      <SelectItem value="SCORM">SCORM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descripción de la lección */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Descripción de la lección</Label>
                  <button
                    type="button"
                    onClick={generateLessonDesc}
                    disabled={aiDescLoading}
                    className="flex items-center gap-1 text-[10px] text-yelau-yellow hover:text-yelau-yellow/80 transition-colors disabled:opacity-50"
                  >
                    {aiDescLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generar con IA
                  </button>
                </div>
                <textarea
                  value={lessonDesc}
                  onChange={e => setLessonDesc(e.target.value)}
                  placeholder="Explica brevemente de qué trata esta lección y qué aprenderá el alumno..."
                  rows={3}
                  className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50 resize-none"
                />
              </div>

              {lessonType === "VIDEO" && (
                <div className="space-y-2">
                  <Label className="text-xs">Vídeo</Label>
                  {/* Selector de modo */}
                  <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                    <button
                      type="button"
                      onClick={() => { setVideoMode("upload"); setLessonUrl(""); }}
                      className={cn(
                        "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                        videoMode === "upload"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Subir vídeo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setVideoMode("url"); setLessonUrl(""); }}
                      className={cn(
                        "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                        videoMode === "url"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      YouTube / Vimeo
                    </button>
                  </div>

                  {videoMode === "upload" ? (
                    <VideoUploader
                      currentUid={lessonUrl || null}
                      onUploadComplete={(uid) => setLessonUrl(uid)}
                    />
                  ) : (
                    <div className="space-y-1">
                      <Input
                        value={lessonUrl}
                        onChange={e => setLessonUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                        type="url"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Pega la URL de YouTube o Vimeo. El vídeo se incrustará automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {["PDF", "SCORM"].includes(lessonType) && (
                <div className="space-y-1">
                  <Label className="text-xs">{urlLabel[lessonType]}</Label>
                  <Input
                    value={lessonUrl}
                    onChange={e => setLessonUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              )}

              <div className="space-y-1 w-32">
                <Label className="text-xs">Duración (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={lessonDuration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={submitLesson}
                  disabled={saving}
                  className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Añadir lección"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingLesson(false); setLessonTitle(""); setLessonUrl(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-yelau-yellow/40 rounded-lg transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir lección
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── LessonEditForm ────────────────────────────────────────────────────────────

function LessonEditForm({ lesson, moduleTitle, onSave, onCancel }: {
  lesson: Lesson;
  moduleTitle: string;
  onSave: (data: Partial<Lesson>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]         = useState(lesson.title);
  const [description, setDesc]    = useState(lesson.description ?? "");
  const [type, setType]           = useState<LessonType>(lesson.type);
  const [videoUrl, setVideoUrl]   = useState(lesson.videoUrl ?? "");
  const [fileUrl, setFileUrl]     = useState(lesson.fileUrl ?? "");
  const [duration, setDuration]   = useState(String(lesson.duration ?? ""));
  const [videoMode, setMode]      = useState<"upload" | "url">(
    lesson.videoUrl && lesson.videoUrl.startsWith("http") ? "url" : "upload"
  );
  const [saving, setSaving]       = useState(false);
  const [aiDescLoading, setAiDesc] = useState(false);
  const [aiQuizLoading, setAiQuiz] = useState(false);
  const [quizQuestions, setQuiz]  = useState<Array<{question:string;options:string[];correct:number}> | null>(null);

  async function generateDesc() {
    if (!title.trim()) { toast.error("Escribe primero el título de la lección"); return; }
    setAiDesc(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "lessonDescription", lessonTitle: title, moduleTitle, courseTitle: "" }),
      });
      const data = await res.json();
      if (data.text) setDesc(data.text);
      else toast.error(data.error ?? "Error al generar");
    } catch { toast.error("Error de conexión"); }
    finally { setAiDesc(false); }
  }

  async function generateQuiz() {
    if (!title.trim()) { toast.error("Escribe primero el título de la lección"); return; }
    setAiQuiz(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quiz", lessonTitle: title, moduleTitle, courseTitle: "" }),
      });
      const data = await res.json();
      if (data.text) {
        const clean = data.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setQuiz(parsed);
        toast.success("Preguntas generadas — revísalas y guarda la lección");
      } else toast.error(data.error ?? "Error al generar quiz");
    } catch { toast.error("Error al generar preguntas"); }
    finally { setAiQuiz(false); }
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          type,
          videoUrl: type === "VIDEO" ? (videoUrl || null) : null,
          fileUrl:  type === "PDF"   ? (fileUrl  || null) : null,
          duration: duration ? Number(duration) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      onSave(updated);
      toast.success("Lección actualizada");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 rounded-lg border border-yelau-yellow/30 bg-yelau-yellow/5 space-y-3">
      <p className="text-xs font-semibold text-foreground">Editar lección</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={v => setType(v as LessonType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="VIDEO">Vídeo</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="LIVE_CLASS">Directo</SelectItem>
              <SelectItem value="SCORM">SCORM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Descripción de la lección</Label>
          <button
            type="button"
            onClick={generateDesc}
            disabled={aiDescLoading}
            className="flex items-center gap-1 text-[10px] text-yelau-yellow hover:text-yelau-yellow/80 transition-colors disabled:opacity-50"
          >
            {aiDescLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generar con IA
          </button>
        </div>
        <textarea
          value={description}
          onChange={e => setDesc(e.target.value)}
          placeholder="Explica brevemente de qué trata esta lección y qué aprenderá el alumno..."
          rows={3}
          className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50 resize-none"
        />
      </div>

      {type === "VIDEO" && (
        <div className="space-y-2">
          <Label className="text-xs">Vídeo</Label>
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button type="button" onClick={() => setMode("upload")}
              className={cn("px-3 py-1 text-xs rounded-md font-medium transition-colors",
                videoMode === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              Subir vídeo
            </button>
            <button type="button" onClick={() => setMode("url")}
              className={cn("px-3 py-1 text-xs rounded-md font-medium transition-colors",
                videoMode === "url" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              YouTube / Vimeo
            </button>
          </div>
          {videoMode === "upload" ? (
            <VideoUploader currentUid={videoUrl || null} onUploadComplete={setVideoUrl} />
          ) : (
            <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..." type="url" />
          )}
        </div>
      )}

      {type === "PDF" && (
        <div className="space-y-1">
          <Label className="text-xs">URL del PDF</Label>
          <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." type="url" />
        </div>
      )}

      {/* Quiz: generador IA de preguntas */}
      {type === "QUIZ" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Preguntas del quiz</Label>
            <button
              type="button"
              onClick={generateQuiz}
              disabled={aiQuizLoading}
              className="flex items-center gap-1 text-[10px] text-yelau-yellow hover:text-yelau-yellow/80 transition-colors disabled:opacity-50"
            >
              {aiQuizLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Generar preguntas con IA
            </button>
          </div>
          {quizQuestions && (
            <div className="space-y-2 rounded-lg border border-yelau-yellow/20 bg-background p-3">
              {quizQuestions.map((q, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-medium text-foreground">{i + 1}. {q.question}</p>
                  <ul className="space-y-0.5 pl-3">
                    {q.options.map((opt, oi) => (
                      <li key={oi} className={cn("text-[11px]", oi === q.correct ? "text-green-400 font-semibold" : "text-muted-foreground")}>
                        {oi === q.correct ? "✓" : "○"} {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">Verde = respuesta correcta. Las preguntas se guardarán al hacer clic en Guardar.</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1 w-32">
        <Label className="text-xs">Duración (minutos)</Label>
        <Input type="number" min={1} value={duration} onChange={e => setDuration(e.target.value)} placeholder="0" />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}
          className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Guardar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5">
          <X className="w-3.5 h-3.5" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
