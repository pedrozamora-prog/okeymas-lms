"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, Loader2, MessageSquare,
  Users, ChevronDown, ChevronUp, Sparkles, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Scenario {
  id:              string;
  title:           string;
  description:     string | null;
  customerContext: string;
  objective:       string;
  difficulty:      Difficulty;
  isActive:        boolean;
  createdAt:       string;
  _count:          { attempts: number };
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = { EASY: "Fácil", MEDIUM: "Medio", HARD: "Difícil" };
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  EASY:   "bg-green-500/10  text-green-400  border-green-500/20",
  MEDIUM: "bg-amber-500/10  text-amber-500  border-amber-500/20",
  HARD:   "bg-red-500/10    text-red-400    border-red-500/20",
};

const BLANK_FORM = { title: "", description: "", customerContext: "", objective: "", difficulty: "MEDIUM" as Difficulty };

const TEMPLATES = [
  {
    label: "Cliente que quiere darse de baja",
    customerContext: "Eres María, socia del gimnasio desde hace 2 años. Llevas semanas sin venir y quieres cancelar tu membresía porque crees que no le sacas partido. Estás un poco a la defensiva pero no eres agresiva. Si el empleado te ofrece algo interesante (pausa, descuento, cambio de tarifa), podrías reconsiderarlo.",
    objective: "Retener a la socia ofreciéndole una alternativa (pausa, descuento o cambio de plan). El cliente NO debe darse de baja al final.",
    difficulty: "MEDIUM" as Difficulty,
  },
  {
    label: "Venta de membresía anual",
    customerContext: "Eres Carlos, tienes 35 años y llevas un mes viniendo como visitante de día. Te ha gustado el gimnasio pero dudas en comprometerte con una membresía anual por el precio. Estás interesado pero necesitas que te convenzan con argumentos claros de ahorro y valor.",
    objective: "Cerrar la venta de la membresía anual explicando el ahorro respecto a mensual y los beneficios incluidos.",
    difficulty: "EASY" as Difficulty,
  },
  {
    label: "Reclamación por cobro incorrecto",
    customerContext: "Eres Ana, socia enfadada porque te han cobrado dos veces la cuota este mes. Llevas 20 minutos esperando y estás molesta. Quieres una solución inmediata y una disculpa. Si no la consigues, amenazas con ir a consumidores.",
    objective: "Resolver la reclamación con empatía, confirmar el error, ofrecer devolución y disculpa sincera. El cliente debe irse satisfecho.",
    difficulty: "HARD" as Difficulty,
  },
];

export default function ScenariosPage() {
  const [scenarios, setScenarios]   = useState<Scenario[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [showForm,  setShowForm]    = useState(false);
  const [editId,    setEditId]      = useState<string | null>(null);
  const [saving,    setSaving]      = useState(false);
  const [form,      setForm]        = useState(BLANK_FORM);
  const [expanded,  setExpanded]    = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/scenarios");
    const data = await res.json();
    setScenarios(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(BLANK_FORM); setEditId(null); setShowForm(true); }

  function openEdit(s: Scenario) {
    setForm({ title: s.title, description: s.description ?? "", customerContext: s.customerContext, objective: s.objective, difficulty: s.difficulty });
    setEditId(s.id);
    setShowForm(true);
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setForm(f => ({ ...f, customerContext: t.customerContext, objective: t.objective, difficulty: t.difficulty, title: f.title || t.label }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.customerContext.trim() || !form.objective.trim()) {
      toast.error("Completa título, contexto y objetivo");
      return;
    }
    setSaving(true);
    try {
      const url    = editId ? `/api/admin/scenarios/${editId}` : "/api/admin/scenarios";
      const method = editId ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(editId ? "Escenario actualizado" : "Escenario creado");
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este escenario? Se borrarán también los intentos.")) return;
    await fetch(`/api/admin/scenarios/${id}`, { method: "DELETE" });
    toast.success("Escenario eliminado");
    load();
  }

  async function toggleActive(s: Scenario) {
    await fetch(`/api/admin/scenarios/${s.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isActive: !s.isActive }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Simulador de conversaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea escenarios de práctica para que tu equipo simule situaciones reales con clientes IA.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" />
          Nuevo escenario
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-5">
          <h3 className="font-bold text-sm">{editId ? "Editar escenario" : "Nuevo escenario"}</h3>

          {/* Templates */}
          {!editId && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Plantillas rápidas</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => applyTemplate(t)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Título del escenario *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Retención de baja voluntaria" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Descripción (visible para el alumno)</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Practica cómo retener a un socio que quiere darse de baja" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Contexto del cliente IA *
                <span className="ml-1 text-muted-foreground/60 font-normal">(quién es, situación, cómo reacciona)</span>
              </label>
              <textarea
                value={form.customerContext}
                onChange={e => setForm(f => ({ ...f, customerContext: e.target.value }))}
                rows={4}
                placeholder="Ej: Eres María, socia desde hace 2 años. Llevas semanas sin venir y quieres cancelar porque no le sacas partido..."
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                Objetivo del empleado *
              </label>
              <Input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} placeholder="Ej: Retener al socio ofreciendo una pausa o descuento. El cliente NO debe darse de baja." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dificultad</label>
              <select
                value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="EASY">Fácil</option>
                <option value="MEDIUM">Medio</option>
                <option value="HARD">Difícil</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {editId ? "Guardar cambios" : "Crear escenario"}
            </Button>
          </div>
        </div>
      )}

      {/* Scenarios list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : scenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-border rounded-2xl text-muted-foreground">
          <MessageSquare className="w-10 h-10 opacity-30" />
          <p className="text-sm">Sin escenarios todavía. Crea el primero o usa una plantilla.</p>
          <Button onClick={openCreate} variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Crear escenario
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map(s => (
            <div key={s.id} className={cn("rounded-xl border bg-card overflow-hidden transition-opacity", !s.isActive && "opacity-50")}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <Badge className={cn("text-[10px] border flex-shrink-0", DIFFICULTY_COLOR[s.difficulty])}>
                  {DIFFICULTY_LABEL[s.difficulty]}
                </Badge>
                <span className="flex-1 font-semibold text-sm text-foreground truncate">{s.title}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Users className="w-3 h-3" /> {s._count.attempts}
                </span>
                <Badge variant={s.isActive ? "default" : "outline"} className="text-[10px] flex-shrink-0">
                  {s.isActive ? "Activo" : "Inactivo"}
                </Badge>
                {expanded === s.id ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>

              {expanded === s.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Contexto del cliente</p>
                      <p className="text-xs text-foreground leading-relaxed line-clamp-4">{s.customerContext}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-primary font-semibold flex items-center gap-1"><Target className="w-3 h-3" /> Objetivo del empleado</p>
                      <p className="text-xs text-foreground leading-relaxed">{s.objective}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(s)} className="text-xs h-7">
                      {s.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)} className="gap-1 text-xs h-7">
                      <Pencil className="w-3 h-3" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)} className="gap-1 text-xs h-7 text-red-400 hover:text-red-300 hover:border-red-500/30">
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
