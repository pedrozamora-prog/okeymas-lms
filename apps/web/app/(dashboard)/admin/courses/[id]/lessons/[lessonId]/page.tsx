"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  BookOpen, Clock, CheckCircle2,
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
  content: Block[] | null;
  module: { title: string; courseId: string; course: { title: string } };
}

export default function LessonEditorPage() {
  const params   = useParams();
  const router   = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson,  setLesson]  = useState<LessonData | null>(null);
  const [blocks,  setBlocks]  = useState<Block[]>([]);
  const [title,   setTitle]   = useState("");
  const [duration, setDuration] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const fetchLesson = useCallback(async () => {
    try {
      const res  = await fetch(`/api/admin/lessons/${lessonId}`);
      const data = await res.json() as LessonData;
      setLesson(data);
      setTitle(data.title);
      setDuration(data.duration?.toString() ?? "");
      setBlocks((data.content as Block[]) ?? []);
    } catch {
      toast.error("Error al cargar la lección");
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

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
          </TabsList>

          <TabsContent value="editor">
            <LessonBlockEditor
              initialBlocks={blocks}
              onChange={b => { setBlocks(b); setDirty(true); }}
            />
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
