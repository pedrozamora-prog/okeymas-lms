"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Plus, Trash2, Save, ChevronDown, ChevronUp,
  Loader2, GitBranch, ArrowDown, ArrowRight, X, ToggleLeft, ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

type Course = { id: string; title: string };
type PathCourse = { courseId: string; order: number; onFailGoTo: string | null; course: Course };
type LPath = { id: string; title: string; description: string | null; isActive: boolean; courses: PathCourse[] };
type PlanError = { requiredPlan: string; currentPlan: string };

export default function LearningPathsPage() {
  const [paths,     setPaths]     = useState<LPath[]>([]);
  const [courses,   setCourses]   = useState<Course[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [planError, setPlanError] = useState<PlanError | null>(null);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [saving,    setSaving]    = useState<string | null>(null);

  // New path form
  const [newTitle, setNewTitle]   = useState("");
  const [newDesc,  setNewDesc]    = useState("");
  const [creating, setCreating]   = useState(false);

  // Per-path edit state
  const [edits, setEdits] = useState<Record<string, PathCourse[]>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/learning-paths"),
      fetch("/api/admin/courses"),
    ]);
    if (pRes.status === 403) {
      const data = await pRes.json();
      if (data.error === "PLAN_LIMIT") {
        setPlanError({ requiredPlan: data.requiredPlan, currentPlan: data.currentPlan });
        setLoading(false);
        return;
      }
    }
    if (pRes.ok) setPaths(await pRes.json());
    if (cRes.ok) {
      const data = await cRes.json();
      setCourses(Array.isArray(data) ? data : (data.courses ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function createPath() {
    if (!newTitle.trim()) { toast.error("Escribe un título"); return; }
    setCreating(true);
    const res = await fetch("/api/admin/learning-paths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, description: newDesc }),
    });
    if (res.ok) {
      const p = await res.json();
      setPaths(prev => [p, ...prev]);
      setNewTitle(""); setNewDesc("");
      toast.success("Ruta creada");
    }
    setCreating(false);
  }

  async function deletePath(id: string) {
    if (!confirm("¿Eliminar esta ruta de aprendizaje?")) return;
    const res = await fetch(`/api/admin/learning-paths/${id}`, { method: "DELETE" });
    if (res.ok) { setPaths(p => p.filter(x => x.id !== id)); toast.success("Ruta eliminada"); }
  }

  async function savePath(path: LPath) {
    setSaving(path.id);
    const courseList = edits[path.id] ?? path.courses;
    const res = await fetch(`/api/admin/learning-paths/${path.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:       path.title,
        description: path.description,
        isActive:    path.isActive,
        courses:     courseList.map((c, i) => ({ courseId: c.courseId, order: i, onFailGoTo: c.onFailGoTo || null })),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPaths(p => p.map(x => x.id === path.id ? updated : x));
      setEdits(e => { const n = {...e}; delete n[path.id]; return n; });
      toast.success("Ruta guardada");
    } else toast.error("Error al guardar");
    setSaving(null);
  }

  function getCourseList(path: LPath): PathCourse[] {
    return edits[path.id] ?? path.courses;
  }

  function updateCourseList(pathId: string, list: PathCourse[]) {
    setEdits(e => ({ ...e, [pathId]: list }));
  }

  function addCourse(path: LPath, courseId: string) {
    const list = getCourseList(path);
    if (list.find(c => c.courseId === courseId)) { toast.error("Ya está en la ruta"); return; }
    const course = courses.find(c => c.id === courseId)!;
    updateCourseList(path.id, [...list, { courseId, order: list.length, onFailGoTo: null, course }]);
  }

  function removeCourse(path: LPath, courseId: string) {
    const list = getCourseList(path).filter(c => c.courseId !== courseId);
    // Clear onFailGoTo references to removed course
    const cleaned = list.map(c => ({ ...c, onFailGoTo: c.onFailGoTo === courseId ? null : c.onFailGoTo }));
    updateCourseList(path.id, cleaned);
  }

  function moveUp(path: LPath, idx: number) {
    if (idx === 0) return;
    const list = [...getCourseList(path)];
    [list[idx-1], list[idx]] = [list[idx], list[idx-1]];
    updateCourseList(path.id, list);
  }

  function moveDown(path: LPath, idx: number) {
    const list = [...getCourseList(path)];
    if (idx >= list.length-1) return;
    [list[idx], list[idx+1]] = [list[idx+1], list[idx]];
    updateCourseList(path.id, list);
  }

  function setOnFail(path: LPath, courseId: string, failGoTo: string) {
    const list = getCourseList(path).map(c =>
      c.courseId === courseId ? { ...c, onFailGoTo: failGoTo || null } : c
    );
    updateCourseList(path.id, list);
  }

  function toggleActive(path: LPath) {
    setPaths(p => p.map(x => x.id === path.id ? { ...x, isActive: !x.isActive } : x));
    setEdits(e => ({ ...e, [path.id]: getCourseList(path) }));
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-yelau-yellow" /></div>;
  if (planError) return <UpgradeBanner feature="Rutas de aprendizaje" requiredPlan={planError.requiredPlan} currentPlan={planError.currentPlan} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-yelau-yellow" />
          Rutas de aprendizaje
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Crea itinerarios con lógica condicional — si suspende, redirige a un módulo remedial.</p>
      </div>

      {/* Crear nueva ruta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-yelau-yellow" />Nueva ruta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Título de la ruta…" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Input placeholder="Descripción (opcional)…" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          </div>
          <Button onClick={createPath} disabled={creating} size="sm"
            className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2">
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Crear ruta
          </Button>
        </CardContent>
      </Card>

      {/* Lista de rutas */}
      {paths.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No hay rutas creadas aún.</div>
      ) : paths.map(path => {
        const courseList = getCourseList(path);
        const isDirty    = !!edits[path.id];
        const isOpen     = expanded === path.id;

        return (
          <Card key={path.id} className={`transition-colors ${path.isActive ? "" : "opacity-60"}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-yelau-yellow/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4 text-yelau-yellow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{path.title}</p>
                    {path.description && <p className="text-xs text-muted-foreground truncate">{path.description}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{courseList.length} cursos</Badge>
                  {!path.isActive && <Badge variant="outline" className="text-[10px] text-muted-foreground flex-shrink-0">Inactiva</Badge>}
                  {isDirty && <Badge className="text-[10px] bg-amber-500/20 text-amber-500 border-amber-500/30 flex-shrink-0">Sin guardar</Badge>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive(path)} title={path.isActive ? "Desactivar" : "Activar"}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    {path.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  {isDirty && (
                    <Button size="sm" onClick={() => savePath(path)} disabled={saving === path.id}
                      className="h-7 text-xs bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-1">
                      {saving === path.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Guardar
                    </Button>
                  )}
                  <button onClick={() => setExpanded(isOpen ? null : path.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deletePath(path.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>

            {isOpen && (
              <CardContent className="space-y-4 pt-2">
                {/* Añadir curso */}
                <div className="flex gap-2">
                  <select
                    className="flex-1 text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-yelau-yellow/50"
                    defaultValue=""
                    onChange={e => { if (e.target.value) addCourse(path, e.target.value); e.target.value = ""; }}
                  >
                    <option value="">+ Añadir curso a la ruta…</option>
                    {courses.filter(c => !courseList.find(x => x.courseId === c.id)).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Lista de cursos con branching */}
                {courseList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin cursos. Añade el primero arriba.</p>
                ) : (
                  <div className="space-y-2">
                    {courseList.map((pc, idx) => {
                      const otherCourses = courseList.filter(c => c.courseId !== pc.courseId);
                      return (
                        <div key={pc.courseId}>
                          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
                            {/* Order controls */}
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <button onClick={() => moveUp(path, idx)} disabled={idx===0}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => moveDown(path, idx)} disabled={idx===courseList.length-1}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="w-6 h-6 rounded-full bg-yelau-yellow flex items-center justify-center flex-shrink-0 text-[10px] font-black text-yelau-black">
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <p className="text-sm font-medium text-foreground truncate">{pc.course.title}</p>

                              {/* Branching rule */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" /> Si suspende →
                                </span>
                                <select
                                  value={pc.onFailGoTo ?? ""}
                                  onChange={e => setOnFail(path, pc.courseId, e.target.value)}
                                  className="flex-1 text-[10px] border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-yelau-yellow/30"
                                >
                                  <option value="">— Sin redirección (bloquear hasta aprobar) —</option>
                                  {otherCourses.map(c => (
                                    <option key={c.courseId} value={c.courseId}>{c.course.title}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button onClick={() => removeCourse(path, pc.courseId)}
                              className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Visual connector */}
                          {idx < courseList.length - 1 && (
                            <div className="flex items-center gap-2 pl-[52px] py-1">
                              <div className="flex flex-col items-center">
                                <ArrowDown className="w-3 h-3 text-green-400" />
                                <span className="text-[9px] text-green-500">Si aprueba</span>
                              </div>
                              {pc.onFailGoTo && (
                                <div className="flex items-center gap-1 ml-6">
                                  <ArrowRight className="w-3 h-3 text-orange-400" />
                                  <span className="text-[9px] text-orange-500">
                                    Si suspende → {courseList.find(c => c.courseId === pc.onFailGoTo)?.course.title}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isDirty && (
                  <Button onClick={() => savePath(path)} disabled={saving === path.id} size="sm"
                    className="w-full bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2">
                    {saving === path.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
