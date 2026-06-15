"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, Video, Pencil, Trash2, Radio, Users, Link as LinkIcon, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AddToCalendar } from "@/components/live/add-to-calendar";

interface LiveClass {
  id: string;
  title: string;
  scheduledAt: string;
  durationMins: number;
  roomUrl: string | null;
  recordingUrl: string | null;
  instructor: { id: string; name: string };
  _count: { attendance: number };
}

interface Instructor {
  id: string;
  name: string;
  role: string;
}

interface Props {
  initialClasses: LiveClass[];
  instructors: Instructor[];
  currentUserId: string;
}

const emptyForm = {
  title: "",
  scheduledAt: "",
  durationMins: "60",
  instructorId: "",
  roomUrl: "",
};

export function LiveClassesClient({ initialClasses, instructors, currentUserId }: Props) {
  const router = useRouter();
  const [classes, setClasses] = useState<LiveClass[]>(initialClasses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LiveClass | null>(null);
  const [deleting, setDeleting] = useState<LiveClass | null>(null);
  const [form, setForm] = useState({ ...emptyForm, instructorId: currentUserId });
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const upcoming = classes.filter(c => !isPast(new Date(new Date(c.scheduledAt).getTime() + c.durationMins * 60 * 1000)));
  const past     = classes.filter(c => isPast(new Date(new Date(c.scheduledAt).getTime() + c.durationMins * 60 * 1000)));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, instructorId: currentUserId });
    setDialogOpen(true);
  }

  function openEdit(cls: LiveClass) {
    setEditing(cls);
    // scheduledAt comes as ISO string — format for datetime-local input
    const local = new Date(cls.scheduledAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const localStr = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    setForm({
      title: cls.title,
      scheduledAt: localStr,
      durationMins: String(cls.durationMins),
      instructorId: cls.instructor.id,
      roomUrl: cls.roomUrl ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.scheduledAt) {
      toast.error("Título y fecha son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title:        form.title.trim(),
        scheduledAt:  new Date(form.scheduledAt).toISOString(),
        durationMins: Number(form.durationMins) || 60,
        instructorId: form.instructorId || currentUserId,
        roomUrl:      form.roomUrl.trim() || null,
      };

      if (editing) {
        const res = await fetch(`/api/admin/live/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json() as LiveClass;
        setClasses(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
        toast.success("Clase actualizada");
      } else {
        const res = await fetch("/api/admin/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const created = await res.json() as LiveClass;
        setClasses(prev => [...prev, created].sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        ));
        toast.success("Clase creada");
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar la clase");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/live/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setClasses(prev => prev.filter(c => c.id !== deleting.id));
      toast.success("Clase eliminada");
    } catch {
      toast.error("Error al eliminar la clase");
    } finally {
      setDeleting(null);
    }
  }

  function isLive(cls: LiveClass) {
    const start = new Date(cls.scheduledAt).getTime();
    const end   = start + cls.durationMins * 60 * 1000;
    const t     = now.getTime();
    return t >= start && t <= end;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Clases en Directo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {classes.length} clase{classes.length !== 1 ? "s" : ""} · {upcoming.length} próxima{upcoming.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva clase
        </Button>
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" /> Próximas
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Video className="w-9 h-9 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay clases programadas</p>
              <Button variant="outline" size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Crear la primera
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                live={isLive(cls)}
                onEdit={() => openEdit(cls)}
                onDelete={() => setDeleting(cls)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Video className="w-4 h-4" /> Historial
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {past.map(cls => (
              <ClassCard
                key={cls.id}
                cls={cls}
                live={false}
                onEdit={() => openEdit(cls)}
                onDelete={() => setDeleting(cls)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar clase" : "Nueva clase en directo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ej: Técnicas de venta avanzadas"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="scheduledAt">Fecha y hora *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={form.durationMins}
                  onChange={e => setForm(f => ({ ...f, durationMins: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructor">Instructor</Label>
              <Select
                value={form.instructorId}
                onValueChange={v => setForm(f => ({ ...f, instructorId: v }))}
              >
                <SelectTrigger id="instructor">
                  <SelectValue placeholder="Selecciona instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roomUrl">Enlace de la sala</Label>
              <Input
                id="roomUrl"
                type="url"
                placeholder="https://meet.google.com/... o Zoom..."
                value={form.roomUrl}
                onChange={e => setForm(f => ({ ...f, roomUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Google Meet, Zoom, Teams… cualquier enlace de videollamada</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear clase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar clase?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará <span className="font-medium text-foreground">&quot;{deleting?.title}&quot;</span> y todos sus registros de asistencia. Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClassCard({
  cls, live, onEdit, onDelete,
}: {
  cls: LiveClass;
  live: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const past = isPast(new Date(new Date(cls.scheduledAt).getTime() + cls.durationMins * 60 * 1000));

  return (
    <Card className={live ? "border-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]" : ""}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-snug flex-1">{cls.title}</p>
          {live ? (
            <Badge className="bg-red-500 text-white animate-pulse flex-shrink-0">
              <Radio className="w-3 h-3 mr-1" /> EN DIRECTO
            </Badge>
          ) : past ? (
            <Badge variant="outline" className="text-muted-foreground flex-shrink-0 text-[10px]">Finalizada</Badge>
          ) : (
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 flex-shrink-0 text-[10px]">Programada</Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>📅 {format(new Date(cls.scheduledAt), "d MMM yyyy · HH:mm", { locale: es })}</span>
          <span>⏱ {cls.durationMins}min</span>
          <span>👤 {cls.instructor.name}</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {cls._count.attendance} asistentes
          </span>
        </div>

        {/* Room URL */}
        {cls.roomUrl && (
          <a
            href={cls.roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
          >
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{cls.roomUrl}</span>
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {!past && (
            <AddToCalendar
              id={cls.id}
              title={cls.title}
              scheduledAt={cls.scheduledAt}
              durationMins={cls.durationMins}
              roomUrl={cls.roomUrl}
            />
          )}
          <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5 text-xs h-8">
            <Pencil className="w-3 h-3" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3 h-3" /> Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
