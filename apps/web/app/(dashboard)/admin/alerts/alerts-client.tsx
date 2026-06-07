"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, Clock, Eye, Bell, Loader2,
  ShieldAlert, TrendingDown, Activity, RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { EmployeeAlert, RiskLevel } from "@/app/api/admin/alerts/route";

/* ── Configuración de colores por nivel ── */
const RISK_CONFIG: Record<RiskLevel, {
  label: string; color: string; bg: string; border: string; icon: React.ElementType;
}> = {
  CRITICAL: { label: "Crítico", color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: ShieldAlert   },
  HIGH:     { label: "Alto",    color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle },
  MEDIUM:   { label: "Medio",   color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  icon: TrendingDown  },
  WATCH:    { label: "Vigilar", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: Eye           },
};


type FilterLevel = "ALL" | RiskLevel;

export function AlertsClient({ orgId }: { orgId: string }) {
  const [alerts,   setAlerts]   = useState<EmployeeAlert[]>([]);
  const [counts,   setCounts]   = useState({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, WATCH: 0 });
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FilterLevel>("ALL");
  const [sending,  setSending]  = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/alerts");
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setCounts(data.counts ?? { CRITICAL: 0, HIGH: 0, MEDIUM: 0, WATCH: 0 });
    } catch {
      toast.error("Error al cargar alertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  async function sendReminder(alert: EmployeeAlert) {
    const key = `${alert.userId}:${alert.courseId}`;
    setSending(key);
    try {
      const res = await fetch("/api/manager/remind", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: alert.userId, courseId: alert.courseId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`Recordatorio enviado a ${alert.userName}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSending(null);
    }
  }

  const filtered = filter === "ALL"
    ? alerts
    : alerts.filter(a => a.riskLevel === filter);

  const criticalPlusHigh = counts.CRITICAL + counts.HIGH;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-primary" />
            Alertas de riesgo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Empleados con formación obligatoria en peligro de incumplimiento
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Actualizar
        </Button>
      </div>

      {/* Banner crítico */}
      {criticalPlusHigh > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-foreground">
            <strong className="text-red-500">{criticalPlusHigh} empleado{criticalPlusHigh > 1 ? "s" : ""}</strong>
            {" "}en riesgo crítico o alto — actúa antes de que venzan sus plazos.
          </p>
        </div>
      )}

      {/* Stats clickables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(["CRITICAL", "HIGH", "MEDIUM", "WATCH"] as RiskLevel[]).map(level => {
          const cfg    = RISK_CONFIG[level];
          const Icon   = cfg.icon;
          const count  = counts[level];
          const active = filter === level;
          return (
            <button
              key={level}
              onClick={() => setFilter(active ? "ALL" : level)}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                active ? `${cfg.border} ${cfg.bg}` : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "ALL",      label: `Todos (${alerts.length})` },
          { key: "CRITICAL", label: `Crítico (${counts.CRITICAL})` },
          { key: "HIGH",     label: `Alto (${counts.HIGH})` },
          { key: "MEDIUM",   label: `Medio (${counts.MEDIUM})` },
          { key: "WATCH",    label: `Vigilar (${counts.WATCH})` },
        ] as { key: FilterLevel; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
              filter === f.key
                ? "bg-primary text-yelau-black border-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border rounded-xl">
          <Activity className="w-12 h-12 text-green-500/40" />
          <p className="font-semibold text-foreground">
            {filter === "ALL" ? "¡Sin alertas! Todo el equipo está al día" : `Sin alertas en nivel ${RISK_CONFIG[filter as RiskLevel]?.label}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === "ALL" ? "No hay formaciones obligatorias en riesgo de incumplimiento." : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const cfg     = RISK_CONFIG[alert.riskLevel];
            const Icon    = cfg.icon;
            const sendKey = `${alert.userId}:${alert.courseId}`;
            const isSending = sending === sendKey;

            return (
              <div
                key={sendKey}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${cfg.border} bg-card`}
              >
                {/* Avatar + nivel */}
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                    <span className={`text-sm font-black ${cfg.color}`}>
                      {alert.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${cfg.color} ${cfg.border} ${cfg.bg}`}>
                    <Icon className="w-2.5 h-2.5 mr-0.5" />
                    {cfg.label}
                  </Badge>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-foreground">{alert.userName}</p>
                      <p className="text-xs text-muted-foreground">{alert.userEmail}
                        {alert.department && ` · ${alert.department}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSending}
                      onClick={() => sendReminder(alert)}
                      className={`h-7 text-[11px] gap-1 flex-shrink-0 ${
                        alert.riskLevel === "CRITICAL" ? "border-red-300 text-red-600 hover:bg-red-50" :
                        alert.riskLevel === "HIGH"     ? "border-orange-300 text-orange-600 hover:bg-orange-50" :
                        ""
                      }`}
                    >
                      {isSending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Bell className="w-3 h-3" />
                      }
                      Recordatorio
                    </Button>
                  </div>

                  {/* Curso + razón */}
                  <div className={`text-xs px-3 py-2 rounded-lg ${cfg.bg} ${cfg.border} border`}>
                    <p className="font-semibold text-foreground">{alert.courseTitle}</p>
                    <p className={`mt-0.5 ${cfg.color}`}>{alert.riskReason}</p>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.daysLeft !== null
                          ? alert.daysLeft < 0
                            ? `Venció hace ${Math.abs(alert.daysLeft)}d`
                            : `${alert.daysLeft}d restantes`
                          : "Sin plazo"}
                      </span>
                      <span>{alert.progressPct}% completado</span>
                    </div>
                    <Progress
                      value={alert.progressPct}
                      className={`h-1.5 ${
                        alert.riskLevel === "CRITICAL" ? "[&>div]:bg-red-500" :
                        alert.riskLevel === "HIGH"     ? "[&>div]:bg-orange-500" :
                        alert.riskLevel === "MEDIUM"   ? "[&>div]:bg-amber-400" :
                        "[&>div]:bg-blue-400"
                      }`}
                    />
                  </div>

                  {alert.lastActivity && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" />
                      Última actividad: {formatDistanceToNow(new Date(alert.lastActivity), { addSuffix: true, locale: es })}
                    </p>
                  )}
                  {!alert.lastActivity && (
                    <p className="text-[10px] text-red-400 flex items-center gap-1">
                      <Activity className="w-2.5 h-2.5" />
                      No ha registrado ninguna actividad
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
