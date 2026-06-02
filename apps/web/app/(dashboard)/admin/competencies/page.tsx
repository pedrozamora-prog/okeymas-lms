"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Badge }  from "@/components/ui/badge";
import { toast }  from "sonner";
import { Plus, Trash2, Target, Pencil, Save, X } from "lucide-react";

interface Competency { id: string; name: string; description: string | null }

export default function CompetenciesPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [adding,       setAdding]       = useState(false);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [name,         setName]         = useState("");
  const [desc,         setDesc]         = useState("");

  const load = () => {
    fetch("/api/admin/competencies").then(r => r.json()).then(d => {
      setCompetencies(d.competencies ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Escribe el nombre");
    const method = editId ? "PUT" : "POST";
    const body   = editId ? { id: editId, name, description: desc } : { name, description: desc };
    const res    = await fetch("/api/admin/competencies", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) { toast.success(editId ? "Competencia actualizada" : "Competencia creada"); reset(); load(); }
    else toast.error("Error al guardar");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta competencia?")) return;
    await fetch(`/api/admin/competencies?id=${id}`, { method: "DELETE" });
    toast.success("Eliminada"); load();
  };

  const startEdit = (c: Competency) => {
    setEditId(c.id); setName(c.name); setDesc(c.description ?? ""); setAdding(true);
  };

  const reset = () => { setAdding(false); setEditId(null); setName(""); setDesc(""); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Competencias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define las habilidades y conocimientos clave para tu organización
          </p>
        </div>
        {!adding && (
          <Button className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
            onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" /> Nueva competencia
          </Button>
        )}
      </div>

      {adding && (
        <Card className="border-yelau-yellow/30 bg-yelau-yellow/5">
          <CardContent className="pt-4 space-y-3">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la competencia" />
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="bg-yelau-yellow text-yelau-black font-bold gap-1.5">
                <Save className="w-3.5 h-3.5" /> {editId ? "Actualizar" : "Crear"}
              </Button>
              <Button size="sm" variant="ghost" onClick={reset} className="gap-1.5">
                <X className="w-3.5 h-3.5" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
      ) : competencies.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No hay competencias definidas todavía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {competencies.map(c => (
            <Card key={c.id} className="hover:border-yelau-yellow/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Target className="w-4 h-4 text-yelau-yellow flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(c)}
                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)}
                      className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors text-muted-foreground">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              {c.description && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {competencies.length} competencia{competencies.length !== 1 ? "s" : ""} definida{competencies.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
