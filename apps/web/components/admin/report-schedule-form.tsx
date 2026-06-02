"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Send, Calendar, Clock } from "lucide-react";

type Frequency = "DISABLED" | "WEEKLY" | "MONTHLY";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes"     },
  { value: 2, label: "Martes"    },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves"    },
  { value: 5, label: "Viernes"   },
  { value: 6, label: "Sábado"    },
  { value: 7, label: "Domingo"   },
];

interface Props {
  orgId:              string;
  initialFrequency:   Frequency;
  initialDayOfWeek:   number;
  initialDayOfMonth:  number;
  lastSentAt:         string | null;
}

export function ReportScheduleForm({
  orgId,
  initialFrequency,
  initialDayOfWeek,
  initialDayOfMonth,
  lastSentAt,
}: Props) {
  const [frequency,   setFrequency]   = useState<Frequency>(initialFrequency);
  const [dayOfWeek,   setDayOfWeek]   = useState(initialDayOfWeek);
  const [dayOfMonth,  setDayOfMonth]  = useState(initialDayOfMonth);
  const [saving,      setSaving]      = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [saved,       setSaved]       = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reportFrequency: frequency, reportDayOfWeek: dayOfWeek, reportDayOfMonth: dayOfMonth }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Configuración de informes guardada");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTestSending(true);
    try {
      const res = await fetch(`/api/admin/org/${orgId}/test-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Informe de prueba enviado a tu email");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setTestSending(false);
    }
  }

  const scheduleDesc = frequency === "DISABLED"
    ? "Los informes automáticos están desactivados"
    : frequency === "WEEKLY"
      ? `Cada ${DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label ?? "Lunes"} a las 7:00 AM`
      : `El día ${dayOfMonth} de cada mes a las 7:00 AM`;

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">

        {/* Selector de frecuencia */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frecuencia</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "DISABLED", label: "Desactivado", desc: "Sin envíos" },
              { value: "WEEKLY",   label: "Semanal",     desc: "Cada semana" },
              { value: "MONTHLY",  label: "Mensual",     desc: "Cada mes"    },
            ] as { value: Frequency; label: string; desc: string }[]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  frequency === opt.value
                    ? "border-yelau-yellow bg-yelau-yellow/10"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <p className={`text-xs font-bold ${frequency === opt.value ? "text-yelau-yellow" : "text-foreground"}`}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de día */}
        {frequency === "WEEKLY" && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Día de envío
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDayOfWeek(d.value)}
                  className="focus:outline-none"
                >
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-colors text-xs px-3 py-1 ${
                      dayOfWeek === d.value
                        ? "border-yelau-yellow bg-yelau-yellow/10 text-yelau-yellow"
                        : "hover:border-muted-foreground/40"
                    }`}
                  >
                    {d.label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {frequency === "MONTHLY" && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Día del mes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDayOfMonth(d)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors border ${
                    dayOfMonth === d
                      ? "bg-yelau-yellow text-yelau-black border-yelau-yellow"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Limitado al 28 para evitar meses cortos</p>
          </div>
        )}

        {/* Estado actual */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          frequency === "DISABLED" ? "bg-muted/50 border border-border" : "bg-yelau-yellow/10 border border-yelau-yellow/20"
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            frequency === "DISABLED" ? "bg-muted-foreground" : "bg-yelau-yellow animate-pulse"
          }`} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">{scheduleDesc}</p>
            {lastSentAt && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Último envío: {new Date(lastSentAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {!lastSentAt && frequency !== "DISABLED" && (
              <p className="text-[11px] text-muted-foreground mt-0.5">Aún no se ha enviado ningún informe</p>
            )}
          </div>
          {frequency !== "DISABLED" && (
            <Badge variant="outline" className="text-[10px] border-yelau-yellow/30 text-yelau-yellow bg-yelau-yellow/10">
              Activo
            </Badge>
          )}
        </div>

        {/* Destinatarios */}
        <p className="text-xs text-muted-foreground">
          El informe se envía automáticamente a todos los <strong className="text-foreground">Super Admin</strong>,{" "}
          <strong className="text-foreground">Administradores</strong> y <strong className="text-foreground">Mánagers</strong> de la organización.
        </p>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {saved ? "¡Guardado!" : "Guardar"}
          </Button>

          {frequency !== "DISABLED" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testSending}
              className="gap-2"
            >
              {testSending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              Enviar informe de prueba
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
