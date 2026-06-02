"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, Loader2, CheckCircle2, UserPlus,
  Building2, Search, Calendar,
} from "lucide-react";

/* ── Constantes ── */
const DEPARTMENTS = [
  { value: "ADMINISTRACION", label: "Administración", emoji: "🗂️" },
  { value: "RECEPCION",      label: "Recepción",      emoji: "🛎️" },
  { value: "LIMPIEZA",       label: "Limpieza",       emoji: "🧹" },
  { value: "MONITOR",        label: "Monitor",        emoji: "🏋️" },
  { value: "DEPORTIVO",      label: "Deportivo",      emoji: "⚽" },
];

/* ── Tipos ── */
interface UserPreview {
  id:         string;
  name:       string;
  email:      string;
  department: string | null;
  enrolled:   boolean;
}
interface Props {
  open:       boolean;
  onClose:    () => void;
  onEnrolled: () => void;
  courseId:   string;
  courseTitle: string;
}

export function BulkEnrollModal({ open, onClose, onEnrolled, courseId, courseTitle }: Props) {
  const [tab,           setTab]           = useState<"dept" | "users">("dept");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deadline,      setDeadline]      = useState("");
  const [notify,        setNotify]        = useState(true);

  const [users,         setUsers]         = useState<UserPreview[]>([]);
  const [loadingUsers,  setLoadingUsers]  = useState(false);
  const [search,        setSearch]        = useState("");
  const [enrolling,     setEnrolling]     = useState(false);

  /* ── Cargar preview de usuarios cuando cambian los filtros ── */
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const q = selectedDepts.map(d => `dept=${d}`).join("&");
      const res = await fetch(`/api/admin/courses/${courseId}/bulk-enroll${q ? `?${q}` : ""}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  }, [courseId, selectedDepts]);

  useEffect(() => {
    if (open) loadUsers();
  }, [open, loadUsers]);

  /* ── Helpers ── */
  function toggleDept(d: string) {
    setSelectedDepts(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
    setSelectedUsers([]); // reset al cambiar departamentos
  }

  function toggleUser(id: string) {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleClose() {
    setSelectedDepts([]);
    setSelectedUsers([]);
    setDeadline("");
    setSearch("");
    setTab("dept");
    onClose();
  }

  /* ── Cálculo de preview ── */
  const visibleUsers = tab === "dept"
    ? users
    : users.filter(u =>
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );

  const targetUsers = tab === "dept"
    ? users.filter(u => !u.enrolled)
    : users.filter(u => selectedUsers.includes(u.id) && !u.enrolled);

  const alreadyEnrolled = tab === "dept"
    ? users.filter(u => u.enrolled).length
    : users.filter(u => selectedUsers.includes(u.id) && u.enrolled).length;

  const canEnroll = targetUsers.length > 0;

  /* ── Envío ── */
  async function handleEnroll() {
    if (!canEnroll) return;
    setEnrolling(true);
    try {
      const body = tab === "dept"
        ? { departments: selectedDepts, deadline: deadline || null, notify }
        : { userIds: selectedUsers, deadline: deadline || null, notify };

      const res  = await fetch(`/api/admin/courses/${courseId}/bulk-enroll`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al inscribir");

      toast.success(
        `✓ ${data.enrolled} empleado${data.enrolled !== 1 ? "s" : ""} inscrito${data.enrolled !== 1 ? "s" : ""}` +
        (data.skipped > 0 ? ` · ${data.skipped} ya estaban inscritos` : "")
      );
      handleClose();
      onEnrolled();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al inscribir");
    } finally {
      setEnrolling(false);
    }
  }

  const completionPct = users.length > 0
    ? Math.round((users.filter(u => u.enrolled).length / users.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <UserPlus className="w-5 h-5 text-yelau-yellow" />
            Inscripción masiva
          </DialogTitle>
          <DialogDescription className="truncate">
            Curso: <strong className="text-foreground">{courseTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">

          {/* Estado actual del curso */}
          {!loadingUsers && users.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Inscritos actualmente</span>
                <span className="font-bold text-foreground">
                  {users.filter(u => u.enrolled).length} / {users.length}
                </span>
              </div>
              <Progress value={completionPct} className="h-1.5" />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setTab("dept")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                tab === "dept" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Por departamento
            </button>
            <button
              onClick={() => setTab("users")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
                tab === "users" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Usuarios individuales
            </button>
          </div>

          {/* ── TAB DEPARTAMENTOS ── */}
          {tab === "dept" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Selecciona uno o varios departamentos. Se inscribirán todos sus empleados activos.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {DEPARTMENTS.map(dept => {
                  const deptUsers  = users.filter(u => u.department === dept.value);
                  const newCount   = deptUsers.filter(u => !u.enrolled).length;
                  const doneCount  = deptUsers.filter(u => u.enrolled).length;
                  const selected   = selectedDepts.includes(dept.value);

                  return (
                    <button
                      key={dept.value}
                      type="button"
                      onClick={() => toggleDept(dept.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selected
                          ? "border-yelau-yellow bg-yelau-yellow/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{dept.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${selected ? "text-yelau-yellow" : "text-foreground"}`}>
                          {dept.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {deptUsers.length} empleado{deptUsers.length !== 1 ? "s" : ""}
                          {doneCount > 0 && ` · ${doneCount} ya inscritos`}
                        </p>
                      </div>
                      {newCount > 0 && (
                        <Badge className={`text-[10px] flex-shrink-0 ${
                          selected
                            ? "bg-yelau-yellow text-yelau-black"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          +{newCount} nuevos
                        </Badge>
                      )}
                      {newCount === 0 && deptUsers.length > 0 && (
                        <Badge className="text-[10px] flex-shrink-0 bg-green-100 text-green-700">
                          ✓ Todos inscritos
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB USUARIOS ── */}
          {tab === "users" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o email…"
                  className="pl-8 h-9 text-sm"
                />
              </div>

              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                  {visibleUsers.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">No hay empleados</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {visibleUsers.map(u => (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors ${
                            u.enrolled ? "opacity-50 cursor-default" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.id)}
                            disabled={u.enrolled}
                            onChange={() => !u.enrolled && toggleUser(u.id)}
                            className="accent-yelau-yellow"
                          />
                          <div className="w-7 h-7 rounded-full bg-yelau-yellow/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-yelau-yellow">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                          {u.enrolled && (
                            <Badge className="text-[9px] bg-green-100 text-green-700 flex-shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Inscrito
                            </Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!loadingUsers && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUsers(users.filter(u => !u.enrolled).map(u => u.id))}
                    className="text-[11px] text-brand hover:underline"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-muted-foreground text-[11px]">·</span>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-1.5 pt-1 border-t border-border">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Fecha límite <span className="font-normal">(opcional)</span>
            </label>
            <Input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="h-9 text-sm max-w-xs"
            />
          </div>

          {/* Notificar */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notify}
              onChange={e => setNotify(e.target.checked)}
              className="accent-yelau-yellow w-4 h-4"
            />
            <span className="text-xs text-muted-foreground">
              Enviar email de notificación a los nuevos inscritos
            </span>
          </label>
        </div>

        {/* Footer fijo */}
        <div className="flex-shrink-0 pt-4 border-t border-border space-y-3">
          {/* Resumen */}
          {canEnroll && (
            <div className="flex items-center gap-2 text-xs bg-yelau-yellow/10 border border-yelau-yellow/30 rounded-lg px-3 py-2">
              <UserPlus className="w-3.5 h-3.5 text-yelau-yellow flex-shrink-0" />
              <span className="text-foreground">
                Se inscribirán <strong>{targetUsers.length} empleado{targetUsers.length !== 1 ? "s" : ""}</strong>
                {alreadyEnrolled > 0 && ` · ${alreadyEnrolled} ya inscritos serán omitidos`}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleEnroll}
              disabled={!canEnroll || enrolling}
              className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 flex-1"
            >
              {enrolling
                ? <><Loader2 className="w-4 h-4 animate-spin" />Inscribiendo…</>
                : <><UserPlus className="w-4 h-4" />
                    {canEnroll
                      ? `Inscribir ${targetUsers.length} empleado${targetUsers.length !== 1 ? "s" : ""}`
                      : "Selecciona destinatarios"}
                  </>
              }
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={enrolling}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
