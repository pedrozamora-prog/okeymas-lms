"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, Loader2, ShieldAlert, ChevronRight, Activity } from "lucide-react";
import type { EmployeeAlert, RiskLevel } from "@/app/api/admin/alerts/route";

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  HIGH:     { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  MEDIUM:   { color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  WATCH:    { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
};

export function AlertsWidget() {
  const [alerts,  setAlerts]  = useState<EmployeeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/alerts?minLevel=HIGH")
      .then(r => r.json())
      .then(data => { setAlerts((data.alerts ?? []).slice(0, 5)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function sendReminder(alert: EmployeeAlert) {
    const key = `${alert.userId}:${alert.courseId}`;
    setSending(key);
    try {
      const res = await fetch("/api/manager/remind", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: alert.userId, courseId: alert.courseId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`Recordatorio enviado a ${alert.userName}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSending(null);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (alerts.length === 0) return (
    <div className="flex flex-col items-center py-8 gap-2 text-center">
      <Activity className="w-8 h-8 text-green-500/40" />
      <p className="text-sm text-muted-foreground">Sin alertas críticas o altas</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const cfg     = RISK_CONFIG[alert.riskLevel];
        const sendKey = `${alert.userId}:${alert.courseId}`;
        return (
          <div key={sendKey} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.border} ${cfg.bg}`}>
            <div className={`w-8 h-8 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xs font-black ${cfg.color}`}>
                {alert.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-foreground">{alert.userName}</p>
                <Badge variant="outline" className={`text-[9px] ${cfg.color} ${cfg.border}`}>
                  {alert.riskLevel === "CRITICAL" ? "Crítico" : "Alto"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{alert.courseTitle}</p>
              <p className={`text-[10px] ${cfg.color} mt-0.5`}>{alert.riskReason}</p>
            </div>
            <button
              onClick={() => sendReminder(alert)}
              disabled={sending === sendKey}
              className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${cfg.border} hover:${cfg.bg}`}
              title="Enviar recordatorio"
            >
              {sending === sendKey
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                : <Bell className={`w-3.5 h-3.5 ${cfg.color}`} />
              }
            </button>
          </div>
        );
      })}

      <Link
        href="/admin/alerts"
        className="flex items-center justify-center gap-1.5 text-xs text-brand hover:text-amber-600 transition-colors py-2"
      >
        Ver todas las alertas <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
