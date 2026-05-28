"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Zap, BookOpen, Users } from "lucide-react";

const ROLES = [
  { value: "EMPLOYEE",     label: "Empleado" },
  { value: "INSTRUCTOR",   label: "Instructor" },
  { value: "BRANCH_ADMIN", label: "Admin de sede" },
];

const DEPTS = [
  { value: "ADMINISTRACION", label: "Administración" },
  { value: "RECEPCION",      label: "Recepción" },
  { value: "LIMPIEZA",       label: "Limpieza" },
  { value: "MONITOR",        label: "Monitor" },
  { value: "DEPORTIVO",      label: "Deportivo" },
];

interface Rule {
  id: string;
  courseId: string;
  course: { id: string; title: string };
  triggerRole: string | null;
  triggerDept: string | null;
  daysToComplete: number | null;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  initialRules: Rule[];
  courses: { id: string; title: string }[];
}

export function EnrollmentRulesClient({ initialRules, courses }: Props) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [courseId, setCourseId]           = useState("");
  const [triggerRole, setTriggerRole]     = useState("");
  const [triggerDept, setTriggerDept]     = useState("");
  const [daysToComplete, setDays]         = useState("");
  const [enrollExisting, setExisting]     = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) { toast.error("Selecciona un curso"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/enrollment-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          triggerRole:    triggerRole || null,
          triggerDept:    triggerDept || null,
          daysToComplete: daysToComplete || null,
          enrollExisting,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Regla creada correctamente");
      setOpen(false);
      setCourseId(""); setTriggerRole(""); setTriggerDept(""); setDays(""); setExisting(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la regla");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta regla? No se desinscriben los usuarios existentes.")) return;
    try {
      const res = await fetch(`/api/admin/enrollment-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setRules(r => r.filter(x => x.id !== id));
      toast.success("Regla eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/enrollment-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error();
      setRules(r => r.map(x => x.id === id ? { ...x, isActive } : x));
    } catch {
      toast.error("Error al actualizar");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-yelau-yellow" />
            Inscripción automática
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Los nuevos usuarios se inscriben automáticamente en los cursos que coincidan con su rol o departamento
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2">
              <Plus className="w-4 h-4" />
              Nueva regla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yelau-yellow" />
                Nueva regla de inscripción
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Curso <span className="text-red-400">*</span></Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un curso..." /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <Select value={triggerRole} onValueChange={setTriggerRole}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los roles</SelectItem>
                      {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Select value={triggerDept} onValueChange={setTriggerDept}>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los depts.</SelectItem>
                      {DEPTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="days">Días para completar</Label>
                <Input id="days" type="number" min={1} placeholder="Sin límite" value={daysToComplete} onChange={e => setDays(e.target.value)} />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Switch checked={enrollExisting} onCheckedChange={setExisting} id="existing" />
                <label htmlFor="existing" className="text-sm cursor-pointer">
                  <p className="font-medium">Inscribir usuarios existentes</p>
                  <p className="text-xs text-muted-foreground">Aplica la regla a los empleados ya creados que coincidan</p>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold flex-1">
                  Crear regla
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <Zap className="w-10 h-10 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No hay reglas configuradas</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Crea una regla para que los nuevos empleados se inscriban automáticamente en los cursos que necesiten.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-card border rounded-xl p-4 flex items-center gap-4 transition-opacity ${rule.isActive ? "" : "opacity-50"}`}>
              <div className="w-10 h-10 rounded-full bg-yelau-yellow/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-yelau-yellow" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold text-sm text-foreground truncate">{rule.course.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {rule.triggerRole
                      ? ROLES.find(r => r.value === rule.triggerRole)?.label
                      : "Todos los roles"}
                    {" · "}
                    {rule.triggerDept
                      ? DEPTS.find(d => d.value === rule.triggerDept)?.label
                      : "Todos los departamentos"}
                  </span>
                  {rule.daysToComplete && (
                    <Badge variant="outline" className="text-[10px]">{rule.daysToComplete}d para completar</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Switch checked={rule.isActive} onCheckedChange={v => handleToggle(rule.id, v)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(rule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
