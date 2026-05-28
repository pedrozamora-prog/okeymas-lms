"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Mail, Clock, AlertTriangle, BookOpen, Bell } from "lucide-react";

interface Props {
  orgId: string;
  initial: {
    notifyNewEnrollment: boolean;
    notifyDeadline7d:    boolean;
    notifyDeadline3d:    boolean;
    notifyDeadline1d:    boolean;
    notifyOverdue:       boolean;
  };
}

const notifications = [
  {
    key:     "notifyNewEnrollment" as const,
    icon:    BookOpen,
    label:   "Nueva inscripción en curso",
    desc:    "El empleado recibe un email cuando se le asigna un curso nuevo",
    color:   "text-blue-500",
    bg:      "bg-blue-50",
  },
  {
    key:     "notifyDeadline7d" as const,
    icon:    Clock,
    label:   "Recordatorio 7 días antes",
    desc:    "Aviso cuando quedan 7 días para la fecha límite de un curso obligatorio",
    color:   "text-yelau-yellow",
    bg:      "bg-yelau-yellow/10",
  },
  {
    key:     "notifyDeadline3d" as const,
    icon:    Clock,
    label:   "Recordatorio 3 días antes",
    desc:    "Segundo aviso más urgente cuando quedan 3 días",
    color:   "text-orange-500",
    bg:      "bg-orange-50",
  },
  {
    key:     "notifyDeadline1d" as const,
    icon:    Bell,
    label:   "Recordatorio último día",
    desc:    "Aviso final el día antes de que venza el plazo",
    color:   "text-red-400",
    bg:      "bg-red-50",
  },
  {
    key:     "notifyOverdue" as const,
    icon:    AlertTriangle,
    label:   "Formación vencida",
    desc:    "Notificación cuando un empleado supera la fecha límite sin completar el curso",
    color:   "text-red-600",
    bg:      "bg-red-100",
  },
];

export function NotificationSettingsForm({ orgId, initial }: Props) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving]     = useState<string | null>(null);

  async function handleToggle(key: keyof typeof settings, value: boolean) {
    setSaving(key);
    const prev = settings[key];
    setSettings(s => ({ ...s, [key]: value }));

    try {
      const res = await fetch(`/api/admin/org/${orgId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada");
    } catch {
      setSettings(s => ({ ...s, [key]: prev }));
      toast.error("Error al guardar");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5 divide-y divide-border">
        {notifications.map(n => {
          const Icon = n.icon;
          const enabled = settings[n.key];
          const isSaving = saving === n.key;

          return (
            <div key={n.key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.bg}`}>
                <Icon className={`w-4 h-4 ${n.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  {n.desc}
                </p>
              </div>

              <Switch
                checked={enabled}
                onCheckedChange={v => handleToggle(n.key, v)}
                disabled={isSaving}
              />
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground pt-4">
          Los emails se envían automáticamente desde <strong>noreply@okeymas.com</strong>. Los empleados no pueden desactivarlos individualmente.
        </p>
      </CardContent>
    </Card>
  );
}
