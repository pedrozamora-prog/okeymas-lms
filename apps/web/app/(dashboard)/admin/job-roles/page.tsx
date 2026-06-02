"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Badge }  from "@/components/ui/badge";
import { toast }  from "sonner";
import { Plus, Trash2, Users, Target, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Competency { id: string; name: string }
interface JobRole    { id: string; name: string; description: string | null }

export default function JobRolesPage() {
  const [roles,        setRoles]        = useState<JobRole[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [adding,       setAdding]       = useState(false);
  const [expanded,     setExpanded]     = useState<string | null>(null);
  const [name,         setName]         = useState("");
  const [desc,         setDesc]         = useState("");
  const [roleComps,    setRoleComps]    = useState<Record<string, string[]>>({});
  const [saving,       setSaving]       = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/job-roles").then(r => r.json()),
      fetch("/api/admin/competencies").then(r => r.json()),
    ]).then(([rolesData, compsData]) => {
      setRoles(rolesData.roles ?? []);
      setCompetencies(compsData.competencies ?? []);
      setLoading(false);
    });
  }, []);
  useEffect(load, [load]);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Escribe el nombre del puesto");
    const res = await fetch("/api/admin/job-roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    if (res.ok) { toast.success("Puesto creado"); setName(""); setDesc(""); setAdding(false); load(); }
    else toast.error("Error al crear");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este puesto?")) return;
    await fetch(`/api/admin/job-roles/${id}`, { method: "DELETE" });
    toast.success("Eliminado"); load();
  };

  const toggleCompetency = (roleId: string, compId: string) => {
    setRoleComps(prev => {
      const current = prev[roleId] ?? [];
      return {
        ...prev,
        [roleId]: current.includes(compId)
          ? current.filter(id => id !== compId)
          : [...current, compId],
      };
    });
  };

  const saveRoleComps = async (roleId: string) => {
    setSaving(roleId);
    const res = await fetch(`/api/admin/job-roles/${roleId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencyIds: roleComps[roleId] ?? [] }),
    });
    if (res.ok) toast.success("Competencias actualizadas");
    else toast.error("Error al guardar");
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Puestos de Trabajo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define los puestos y asígnales las competencias requeridas
          </p>
        </div>
        {!adding && (
          <Button className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
            onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" /> Nuevo puesto
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border-yelau-yellow/30 bg-yelau-yellow/5">
          <CardContent className="pt-4 space-y-3">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Recepcionista, Monitor de Sala…" />
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}
                className="bg-yelau-yellow text-yelau-black font-bold">Crear puesto</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No hay puestos definidos todavía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map(role => {
            const isOpen      = expanded === role.id;
            const selected    = roleComps[role.id] ?? [];
            return (
              <Card key={role.id} className="overflow-hidden">
                <div
                  role="button" tabIndex={0}
                  onClick={() => setExpanded(isOpen ? null : role.id)}
                  onKeyDown={e => { if (e.key === "Enter") setExpanded(isOpen ? null : role.id); }}
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  {isOpen
                    ? <ChevronDown  className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                  <Users className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                    )}
                  </div>
                  {selected.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                      {selected.length} competencia{selected.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(role.id); }}
                    className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isOpen && (
                  <CardContent className="pt-0 pb-4 border-t border-border/50 space-y-3">
                    <p className="text-xs text-muted-foreground pt-3">
                      Selecciona las competencias requeridas para este puesto:
                    </p>
                    {competencies.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Define competencias primero en la sección Competencias
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {competencies.map(comp => {
                          const isSelected = selected.includes(comp.id);
                          return (
                            <button
                              key={comp.id}
                              onClick={() => toggleCompetency(role.id, comp.id)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors",
                                isSelected
                                  ? "border-yelau-yellow bg-yelau-yellow/10 text-yelau-yellow font-medium"
                                  : "border-border text-muted-foreground hover:border-yelau-yellow/40"
                              )}
                            >
                              <Target className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{comp.name}</span>
                              {isSelected && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={() => saveRoleComps(role.id)}
                      disabled={saving === role.id}
                      className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold"
                    >
                      {saving === role.id ? "Guardando…" : "Guardar competencias"}
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
