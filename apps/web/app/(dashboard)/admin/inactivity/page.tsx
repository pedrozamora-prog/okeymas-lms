"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  BellRing, Clock, Send, CheckCircle2, Loader2, Users, AlertTriangle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type InactiveUser = {
  id:           string;
  name:         string;
  email:        string;
  department:   string | null;
  lastActivity: string | null; // ISO date or null
  daysSince:    number;
};

const THRESHOLDS = [
  { label: "7 días",  value: 7  },
  { label: "14 días", value: 14 },
  { label: "30 días", value: 30 },
];

export default function InactivityPage() {
  const [threshold, setThreshold]     = useState(14);
  const [users, setUsers]             = useState<InactiveUser[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(false);
  const [message, setMessage]         = useState("");
  const [isPending, startTransition]  = useTransition();

  async function fetchInactive() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/inactivity?days=${threshold}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setSelected(new Set());
    } catch {
      toast.error("Error al cargar usuarios inactivos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInactive(); }, [threshold]);

  function toggleAll() {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map(u => u.id)));
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function sendReminders() {
    if (selected.size === 0) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/inactivity/remind", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userIds: [...selected], message: message || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(`✅ Recordatorio enviado a ${data.sent} usuario${data.sent !== 1 ? "s" : ""}`);
        setSelected(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al enviar recordatorios");
      }
    });
  }

  const urgentCount = users.filter(u => u.daysSince >= 30).length;
  const warningCount = users.filter(u => u.daysSince >= 14 && u.daysSince < 30).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <BellRing className="w-6 h-6 text-primary" />
          Recordatorios de inactividad
        </h1>
        <p className="text-sm text-muted-foreground">
          Detecta alumnos sin actividad y envíales una notificación in-app para reengancharnos.
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{users.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Inactivos ({threshold}d+)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-400/10 flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{warningCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">14–29 días sin entrar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="p-2.5 rounded-xl bg-red-500/10 flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-black text-foreground leading-none">{urgentCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">30+ días sin entrar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de umbral + mensaje personalizado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Mostrar usuarios inactivos hace más de:</p>
            <div className="flex gap-2">
              {THRESHOLDS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setThreshold(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    threshold === t.value
                      ? "bg-primary text-yelau-black border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Mensaje personalizado (opcional):</p>
            <Textarea
              placeholder="Llevas varios días sin estudiar. ¡Vuelve a tu formación y sigue avanzando!"
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="text-sm resize-none h-20"
              maxLength={300}
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{message.length}/300</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuarios inactivos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Usuarios inactivos
              {users.length > 0 && (
                <Badge variant="outline" className="text-[10px]">{users.length}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchInactive} disabled={loading} className="gap-1.5 text-xs">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              {users.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleAll} className="text-xs">
                  {selected.size === users.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400/50" />
              <p className="text-sm text-muted-foreground">
                ¡Todos los alumnos han tenido actividad en los últimos {threshold} días!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map(u => {
                const isSelected = selected.has(u.id);
                const isUrgent   = u.daysSince >= 30;
                const isWarning  = u.daysSince >= 14 && u.daysSince < 30;

                return (
                  <button
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Checkbox visual */}
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${
                      isSelected ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-yelau-black m-auto" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-foreground">
                        {u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      {u.department && (
                        <p className="text-[11px] text-muted-foreground/70 truncate">{u.department}</p>
                      )}
                    </div>

                    {/* Tiempo inactivo */}
                    <div className="flex-shrink-0 text-right space-y-1">
                      <Badge className={`text-[10px] border ${
                        isUrgent
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : isWarning
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {u.daysSince}d sin actividad
                      </Badge>
                      {u.lastActivity ? (
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(u.lastActivity), { locale: es, addSuffix: true })}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Nunca ha entrado</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barra de acción fija */}
      {selected.size > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-primary/20 shadow-lg shadow-black/20">
          <p className="text-sm font-medium text-foreground">
            <span className="text-primary font-black">{selected.size}</span> usuario{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
          </p>
          <Button onClick={sendReminders} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar recordatorio{selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

    </div>
  );
}
