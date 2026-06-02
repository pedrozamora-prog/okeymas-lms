"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Award, Bell, BookOpen, ChevronDown, ChevronUp, Mail,
} from "lucide-react";

/* ── Tipos ── */
interface PendingCourse {
  courseId:   string;
  title:      string;
  isRequired: boolean;
  status:     string;
  deadline:   string | null;
  daysLeft:   number | null;
}
interface Member {
  id:             string;
  name:           string;
  email:          string;
  department:     string | null;
  total:          number;
  completed:      number;
  overdue:        number;
  pct:            number;
  certs:          number;
  points:         number;
  isAtRisk:       boolean;
  isOverdue:      boolean;
  isOnTrack:      boolean;
  requiredPending:number;
  nextDeadline:   string | null;
  daysToNext:     number | null;
  pendingCourses: PendingCourse[];
}
interface Stats {
  total: number; onTrack: number; atRisk: number;
  overdue: number; compliancePct: number;
}
interface Props { members: Member[]; stats: Stats; deptLabel: string; }

type Filter = "all" | "onTrack" | "atRisk" | "overdue";

/* ── Helpers ── */
function statusRing(m: Member) {
  if (m.isOverdue) return "border-red-400";
  if (m.isAtRisk)  return "border-amber-400";
  if (m.isOnTrack) return "border-green-500";
  return "border-border";
}
function progressColor(pct: number, isOverdue: boolean) {
  if (isOverdue) return "[&>div]:bg-red-500";
  if (pct >= 80) return "[&>div]:bg-green-500";
  if (pct >= 40) return "[&>div]:bg-amber-400";
  return "[&>div]:bg-blue-500";
}

/* ── Tarjeta de miembro ── */
function MemberCard({ member }: { member: Member }) {
  const [expanded, setExpanded] = useState(false);
  const [sending,  setSending]  = useState<string | null>(null);

  async function sendReminder(courseId: string, courseName: string) {
    setSending(courseId);
    try {
      const res = await fetch("/api/manager/remind", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: member.id, courseId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success(`Recordatorio enviado a ${member.name}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className={`bg-card border-2 rounded-xl overflow-hidden transition-all ${statusRing(member)}`}>
      {/* Cabecera */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar con indicador */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-yelau-yellow/20 flex items-center justify-center">
              <span className="text-base font-black text-yelau-yellow">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {member.isOverdue && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            {member.isAtRisk && !member.isOverdue && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                <Clock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            {member.isOnTrack && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-foreground">{member.name}</p>
              {member.isOverdue && (
                <Badge className="text-[10px] bg-red-100 text-red-600 border-red-300">
                  {member.overdue} vencido{member.overdue > 1 ? "s" : ""}
                </Badge>
              )}
              {member.isAtRisk && !member.isOverdue && member.daysToNext !== null && (
                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                  ⚠ {member.daysToNext}d para vencer
                </Badge>
              )}
              {member.isOnTrack && member.total > 0 && (
                <Badge className="text-[10px] bg-green-100 text-green-700 border-green-300">
                  ✓ Al día
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{member.email}</p>

            {/* Barra de progreso */}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  {member.completed}/{member.total} cursos
                </span>
                <span className="text-[11px] font-bold text-foreground">{member.pct}%</span>
              </div>
              <Progress
                value={member.pct}
                className={`h-2 ${progressColor(member.pct, member.isOverdue)}`}
              />
            </div>
          </div>

          {/* Métricas derecha */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-1">
            <div className="flex items-center gap-1 text-yelau-yellow">
              <Award className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{member.certs}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px]">{member.points}p</span>
            </div>
          </div>
        </div>

        {/* Toggle detalles */}
        {member.pendingCourses.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-3 w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1 border-t border-border/50"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              {member.pendingCourses.length} curso{member.pendingCourses.length > 1 ? "s" : ""} pendiente{member.pendingCourses.length > 1 ? "s" : ""}
            </span>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>

      {/* Panel expandido — cursos pendientes */}
      {expanded && member.pendingCourses.length > 0 && (
        <div className="border-t border-border bg-muted/30 divide-y divide-border/50">
          {member.pendingCourses.map(course => {
            const isExpired = course.status === "EXPIRED" || (course.daysLeft !== null && course.daysLeft < 0);
            const isSoon    = course.daysLeft !== null && course.daysLeft >= 0 && course.daysLeft <= 3;
            const isSending = sending === course.courseId;

            return (
              <div key={course.courseId} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-medium text-foreground truncate">{course.title}</p>
                    {course.isRequired && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-yelau-yellow/50 text-yelau-yellow">
                        Obligatorio
                      </Badge>
                    )}
                  </div>
                  {course.daysLeft !== null && (
                    <p className={`text-[10px] mt-0.5 ${
                      isExpired ? "text-red-500" :
                      isSoon    ? "text-amber-600" :
                                  "text-muted-foreground"
                    }`}>
                      {isExpired
                        ? `Venció hace ${Math.abs(course.daysLeft)}d`
                        : `${course.daysLeft}d restantes`}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                  onClick={() => sendReminder(course.courseId, course.title)}
                  className={`h-7 text-[10px] gap-1 flex-shrink-0 ${
                    isExpired ? "border-red-300 text-red-600 hover:bg-red-50" :
                    isSoon    ? "border-amber-300 text-amber-700 hover:bg-amber-50" :
                                ""
                  }`}
                >
                  {isSending
                    ? <span className="animate-spin">⋯</span>
                    : <><Mail className="w-3 h-3" />Recordar</>
                  }
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Componente principal ── */
export function TeamClient({ members, stats, deptLabel }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = members.filter(m => {
    if (filter === "onTrack") return m.isOnTrack;
    if (filter === "atRisk")  return m.isAtRisk && !m.isOverdue;
    if (filter === "overdue") return m.isOverdue;
    return true;
  });

  const statCards = [
    {
      label: "Al día",
      value: stats.onTrack,
      icon:  CheckCircle2,
      color: "text-green-600",
      bg:    "bg-green-50",
      ring:  "border-green-200",
      filter: "onTrack" as Filter,
    },
    {
      label: "En riesgo",
      value: stats.atRisk,
      icon:  Clock,
      color: "text-amber-600",
      bg:    "bg-amber-50",
      ring:  "border-amber-200",
      filter: "atRisk" as Filter,
    },
    {
      label: "Atrasados",
      value: stats.overdue,
      icon:  AlertTriangle,
      color: "text-red-500",
      bg:    "bg-red-50",
      ring:  "border-red-200",
      filter: "overdue" as Filter,
    },
    {
      label: "Cumplimiento",
      value: `${stats.compliancePct}%`,
      icon:  TrendingUp,
      color: stats.compliancePct >= 80 ? "text-green-600" : stats.compliancePct >= 50 ? "text-amber-600" : "text-red-500",
      bg:    "bg-muted",
      ring:  "border-border",
      filter: "all" as Filter,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-yelau-yellow" />
            Mi equipo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {deptLabel} · {stats.total} empleado{stats.total !== 1 ? "s" : ""}
          </p>
        </div>
        {stats.overdue > 0 && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {stats.overdue} empleado{stats.overdue > 1 ? "s con" : " con"} formación vencida
          </div>
        )}
      </div>

      {/* Stats clickables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon    = s.icon;
          const active  = filter === s.filter;
          return (
            <button
              key={s.label}
              onClick={() => setFilter(active && s.filter !== "all" ? "all" : s.filter)}
              className={`bg-card rounded-xl border-2 p-4 flex items-center gap-3 text-left transition-all ${
                active ? `${s.ring} ${s.bg}` : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "onTrack", "atRisk", "overdue"] as Filter[]).map(f => {
          const labels: Record<Filter, string> = {
            all:      `Todos (${members.length})`,
            onTrack:  `Al día (${stats.onTrack})`,
            atRisk:   `En riesgo (${stats.atRisk})`,
            overdue:  `Atrasados (${stats.overdue})`,
          };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                filter === f
                  ? "bg-yelau-yellow text-yelau-black border-yelau-yellow"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Grid de tarjetas */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-500/40" />
          <p className="font-semibold text-foreground">
            {filter === "overdue" ? "¡Ningún empleado atrasado!" :
             filter === "atRisk"  ? "¡Ningún empleado en riesgo!" :
             filter === "onTrack" ? "Ningún empleado completamente al día todavía" :
             "No hay empleados en tu equipo"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      )}
    </div>
  );
}
