"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Trash2, Pencil, Loader2, Users } from "lucide-react";

interface Department {
  id:    string;
  name:  string;
  _count: { users: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [newName,     setNewName]     = useState("");
  const [creating,    setCreating]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editName,    setEditName]    = useState("");
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  useEffect(() => { loadDepts(); }, []);

  async function loadDepts() {
    setLoading(true);
    try {
      const data = await fetch("/api/admin/departments").then(r => r.json());
      setDepartments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch("/api/admin/departments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setDepartments(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      toast.success(`Departamento "${data.name}" creado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setSavingId(id);
    try {
      const res  = await fetch(`/api/admin/departments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setDepartments(prev =>
        prev.map(d => d.id === id ? { ...d, name: data.name } : d).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      toast.success("Nombre actualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al renombrar");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(dept: Department) {
    if (dept._count.users > 0) {
      toast.error(`No se puede eliminar: ${dept._count.users} usuario${dept._count.users !== 1 ? "s" : ""} pertenece a este departamento`);
      return;
    }
    if (!confirm(`¿Eliminar el departamento "${dept.name}"?`)) return;
    setDeletingId(dept.id);
    try {
      const res = await fetch(`/api/admin/departments/${dept.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDepartments(prev => prev.filter(d => d.id !== dept.id));
      toast.success(`"${dept.name}" eliminado`);
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Departamentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestiona los departamentos de tu organización
          </p>
        </div>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Nombre del nuevo departamento…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1"
          maxLength={60}
        />
        <Button
          type="submit"
          disabled={creating || !newName.trim()}
          className="bg-primary text-yelau-black hover:bg-primary/90 font-bold gap-2 flex-shrink-0"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Añadir
        </Button>
      </form>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No hay departamentos. Crea el primero arriba.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {departments.map(dept => (
            <div
              key={dept.id}
              className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
            >
              {editingId === dept.id ? (
                <form
                  onSubmit={e => { e.preventDefault(); handleRename(dept.id); }}
                  className="flex-1 flex gap-2"
                >
                  <Input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="h-8 flex-1"
                    maxLength={60}
                  />
                  <Button type="submit" size="sm" disabled={savingId === dept.id} className="bg-primary text-yelau-black hover:bg-primary/90 font-bold h-8">
                    {savingId === dept.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{dept.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] flex items-center gap-1 flex-shrink-0">
                    <Users className="w-2.5 h-2.5" />
                    {dept._count.users} {dept._count.users === 1 ? "usuario" : "usuarios"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={() => { setEditingId(dept.id); setEditName(dept.name); }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                    disabled={deletingId === dept.id}
                    onClick={() => handleDelete(dept)}
                  >
                    {deletingId === dept.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Solo puedes eliminar departamentos sin usuarios asignados.
      </p>
    </div>
  );
}
