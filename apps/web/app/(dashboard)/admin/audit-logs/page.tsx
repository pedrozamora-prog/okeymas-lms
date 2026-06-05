"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, ChevronLeft, ChevronRight, Loader2, User, BookOpen, GraduationCap, Award, LogIn, Settings, Trash2, Eye } from "lucide-react";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type AuditLog = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
};

const ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  USER_LOGIN:           { label: "Login",             color: "bg-blue-500/10 text-blue-400 border-blue-500/20",     icon: LogIn      },
  USER_LOGOUT:          { label: "Logout",            color: "bg-slate-500/10 text-slate-400 border-slate-500/20",  icon: LogIn      },
  USER_CREATED:         { label: "Usuario creado",    color: "bg-green-500/10 text-green-400 border-green-500/20",  icon: User       },
  USER_UPDATED:         { label: "Usuario editado",   color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: User    },
  USER_DEACTIVATED:     { label: "Usuario desactivado", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: User  },
  USER_DELETED:         { label: "Usuario eliminado", color: "bg-red-500/10 text-red-400 border-red-500/20",        icon: Trash2     },
  USER_PASSWORD_RESET:  { label: "Contraseña reset",  color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: User   },
  ROLE_CHANGED:         { label: "Rol cambiado",      color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: User   },
  COURSE_CREATED:       { label: "Curso creado",      color: "bg-green-500/10 text-green-400 border-green-500/20",  icon: BookOpen   },
  COURSE_UPDATED:       { label: "Curso editado",     color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: BookOpen },
  COURSE_PUBLISHED:     { label: "Curso publicado",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20",     icon: Eye        },
  COURSE_ARCHIVED:      { label: "Curso archivado",   color: "bg-slate-500/10 text-slate-400 border-slate-500/20",  icon: BookOpen   },
  COURSE_DELETED:       { label: "Curso eliminado",   color: "bg-red-500/10 text-red-400 border-red-500/20",        icon: Trash2     },
  ENROLLMENT_CREATED:   { label: "Inscripción",       color: "bg-blue-500/10 text-blue-400 border-blue-500/20",     icon: GraduationCap },
  ENROLLMENT_COMPLETED: { label: "Curso completado",  color: "bg-green-500/10 text-green-400 border-green-500/20",  icon: GraduationCap },
  CERTIFICATE_ISSUED:   { label: "Certificado emitido", color: "bg-primary/10 text-primary border-primary/20", icon: Award },
  QUIZ_PASSED:          { label: "Quiz superado",     color: "bg-green-500/10 text-green-400 border-green-500/20",  icon: BookOpen   },
  QUIZ_FAILED:          { label: "Quiz fallado",      color: "bg-red-500/10 text-red-400 border-red-500/20",        icon: BookOpen   },
  SETTINGS_UPDATED:     { label: "Ajustes cambiados", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Settings },
  REPORT_EXPORTED:      { label: "Informe exportado", color: "bg-slate-500/10 text-slate-400 border-slate-500/20",  icon: Settings   },
  API_KEY_GENERATED:    { label: "API key generada",  color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Settings },
};

const ACTION_GROUPS = [
  { label: "Todos",        value: "" },
  { label: "Auth",         value: "USER_LOGIN" },
  { label: "Usuarios",     value: "USER_CREATED" },
  { label: "Cursos",       value: "COURSE_CREATED" },
  { label: "Inscripciones",value: "ENROLLMENT_CREATED" },
  { label: "Certificados", value: "CERTIFICATE_ISSUED" },
  { label: "Ajustes",      value: "SETTINGS_UPDATED" },
];

type PlanError = { requiredPlan: string; currentPlan: string };

export default function AuditLogsPage() {
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [planError, setPlanError] = useState<PlanError | null>(null);
  const [search, setSearch]   = useState("");
  const [action, setAction]   = useState("");
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.set("action", action);
    if (from)   params.set("from", from);
    if (to)     params.set("to", to);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.status === 403) {
      const data = await res.json();
      if (data.error === "PLAN_LIMIT") { setPlanError({ requiredPlan: data.requiredPlan, currentPlan: data.currentPlan }); setLoading(false); return; }
    }
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [page, action, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = search
    ? logs.filter(l =>
        l.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  if (planError) return <UpgradeBanner feature="Logs de auditoría" requiredPlan={planError.requiredPlan} currentPlan={planError.currentPlan} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Logs de auditoría
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro completo de acciones sensibles en la plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Buscar usuario</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nombre o email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Desde</label>
              <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} className="h-9 text-sm w-36" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Hasta</label>
              <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} className="h-9 text-sm w-36" />
            </div>
          </div>

          {/* Filtro por acción */}
          <div className="flex flex-wrap gap-2 mt-3">
            {ACTION_GROUPS.map(g => (
              <button
                key={g.value}
                onClick={() => { setAction(g.value); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                  action === g.value
                    ? "bg-primary text-yelau-black border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{total.toLocaleString()} registros</span>
            <span className="text-xs text-muted-foreground font-normal">Página {page} de {pages}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No hay registros para los filtros seleccionados
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(log => {
                const meta = ACTION_META[log.action] ?? { label: log.action, color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Shield };
                const Icon = meta.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/20 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-semibold border ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        {log.user && (
                          <span className="text-xs font-medium text-foreground">{log.user.name}</span>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <span className="text-xs text-muted-foreground truncate max-w-xs">
                            {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {log.user && (
                          <span className="text-[10px] text-muted-foreground">{log.user.email}</span>
                        )}
                        {log.ipAddress && (
                          <span className="text-[10px] text-muted-foreground">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-1">
                      {format(new Date(log.createdAt), "d MMM yyyy · HH:mm", { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
