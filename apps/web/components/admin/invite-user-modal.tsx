"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const XLSX = require("xlsx") as any;
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import {
  Loader2, Send, Plus, X, UserPlus,
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";

/* ── Constantes ── */
const ROLES = [
  { value: "EMPLOYEE",     label: "Empleado",     desc: "Acceso a cursos y certificados" },
  { value: "INSTRUCTOR",   label: "Instructor",   desc: "Puede crear y dar cursos" },
  { value: "MANAGER",      label: "Mánager",      desc: "Ve el progreso de su equipo" },
  { value: "BRANCH_ADMIN", label: "Administrador",desc: "Gestión completa de la org" },
];
const DEPARTMENTS = [
  { value: "",               label: "Sin departamento" },
  { value: "ADMINISTRACION", label: "Administración" },
  { value: "RECEPCION",      label: "Recepción" },
  { value: "LIMPIEZA",       label: "Limpieza" },
  { value: "MONITOR",        label: "Monitor" },
  { value: "DEPORTIVO",      label: "Deportivo" },
];

/* ── Tipos ── */
interface ParsedRow {
  email:      string;
  role:       string;
  department: string;
  valid:      boolean;
}
interface Props {
  open:    boolean;
  onClose: () => void;
  onSent:  () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Parser de archivo ── */
function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data   = e.target?.result;
        const wb     = XLSX.read(data, { type: "binary" });
        const ws     = wb.Sheets[wb.SheetNames[0]];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (raw.length === 0) { resolve([]); return; }

        // Detectar si la primera fila es cabecera
        const firstRow = raw[0].map(c => String(c).toLowerCase().trim());
        const hasHeader = firstRow.some(c =>
          ["email", "correo", "mail", "e-mail", "rol", "role", "departamento", "department"].includes(c)
        );

        const emailIdx = hasHeader
          ? firstRow.findIndex(c => ["email","correo","mail","e-mail"].includes(c))
          : 0;
        const roleIdx  = hasHeader
          ? firstRow.findIndex(c => ["rol","role"].includes(c))
          : -1;
        const deptIdx  = hasHeader
          ? firstRow.findIndex(c => ["departamento","department","dept"].includes(c))
          : -1;

        const rows = hasHeader ? raw.slice(1) : raw;

        const ROLE_MAP: Record<string,string> = {
          empleado: "EMPLOYEE", employee: "EMPLOYEE",
          instructor: "INSTRUCTOR",
          manager: "MANAGER", mánager: "MANAGER",
          administrador: "BRANCH_ADMIN", admin: "BRANCH_ADMIN", "branch_admin": "BRANCH_ADMIN",
        };
        const DEPT_MAP: Record<string,string> = {
          administración: "ADMINISTRACION", administracion: "ADMINISTRACION",
          recepción: "RECEPCION", recepcion: "RECEPCION",
          limpieza: "LIMPIEZA",
          monitor: "MONITOR",
          deportivo: "DEPORTIVO",
        };

        const parsed: ParsedRow[] = rows
          .map(row => {
            const email = String(row[emailIdx] ?? "").trim().toLowerCase();
            const rawRole = roleIdx >= 0 ? String(row[roleIdx] ?? "").trim().toLowerCase() : "";
            const rawDept = deptIdx >= 0 ? String(row[deptIdx] ?? "").trim().toLowerCase() : "";
            return {
              email,
              role:       ROLE_MAP[rawRole]  ?? "EMPLOYEE",
              department: DEPT_MAP[rawDept]  ?? "",
              valid:      EMAIL_RE.test(email),
            };
          })
          .filter(r => r.email !== "");

        resolve(parsed);
      } catch {
        reject(new Error("No se pudo leer el archivo. Asegúrate de que es un Excel o CSV válido."));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsBinaryString(file);
  });
}

/* ── Componente ── */
export function InviteUserModal({ open, onClose, onSent }: Props) {
  /* Tab manual */
  const [emails,     setEmails]     = useState<string[]>([""]);
  const [role,       setRole]       = useState("EMPLOYEE");
  const [department, setDepartment] = useState("");

  /* Tab importar */
  const [parsedRows,  setParsedRows]  = useState<ParsedRow[]>([]);
  const [dragging,    setDragging]    = useState(false);
  const [parsing,     setParsing]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  /* ── Reset ── */
  function handleClose() {
    setEmails([""]);
    setRole("EMPLOYEE");
    setDepartment("");
    setParsedRows([]);
    onClose();
  }

  /* ── Manual helpers ── */
  const addEmail    = ()                       => setEmails(e => [...e, ""]);
  const removeEmail = (i: number)              => setEmails(e => e.filter((_, idx) => idx !== i));
  const updateEmail = (i: number, v: string)   => setEmails(e => e.map((x, idx) => idx === i ? v : x));

  /* ── Import helpers ── */
  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext ?? "")) {
      toast.error("Formato no soportado. Usa Excel (.xlsx, .xls) o CSV (.csv)");
      return;
    }
    setParsing(true);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) { toast.error("No se encontraron emails en el archivo"); return; }
      setParsedRows(rows);
      toast.success(`${rows.length} filas detectadas`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al leer el archivo");
    } finally {
      setParsing(false);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  function updateRow(i: number, field: keyof ParsedRow, value: string) {
    setParsedRows(rows => rows.map((r, idx) =>
      idx === i
        ? { ...r, [field]: value, valid: field === "email" ? EMAIL_RE.test(value) : r.valid }
        : r
    ));
  }
  function removeRow(i: number) {
    setParsedRows(rows => rows.filter((_, idx) => idx !== i));
  }

  /* ── Envío manual ── */
  async function sendManual(e: React.FormEvent) {
    e.preventDefault();
    const valid = emails.map(e => e.trim().toLowerCase()).filter(e => EMAIL_RE.test(e));
    if (valid.length === 0) { toast.error("Introduce al menos un email válido"); return; }
    await doSend(valid.map(email => ({ email, role, department: department || undefined })));
  }

  /* ── Envío importación ── */
  async function sendImport() {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) { toast.error("No hay emails válidos para enviar"); return; }
    await doSend(validRows.map(r => ({ email: r.email, role: r.role, department: r.department || undefined })));
  }

  /* ── Envío compartido ── */
  async function doSend(items: { email: string; role: string; department?: string }[]) {
    setLoading(true);
    try {
      // Agrupamos por rol+dept para hacer llamadas batch
      const res = await fetch("/api/admin/invitations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails:     items.map(i => i.email),
          role:       items[0].role,       // si viene del manual todos tienen el mismo
          department: items[0].department,
          // Para importación, enviamos items individuales si hay roles mixtos
          ...(items.some(i => i.role !== items[0].role || i.department !== items[0].department)
            ? { items }  // el API lo detectará
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");

      const sent   = data.results.filter((r: any) => r.status === "sent").length;
      const exists = data.results.filter((r: any) => r.status === "exists").length;
      if (sent > 0)   toast.success(`${sent} invitación${sent > 1 ? "es" : ""} enviada${sent > 1 ? "s" : ""}`);
      if (exists > 0) toast.info(`${exists} email${exists > 1 ? "s" : ""} ya pertenece${exists > 1 ? "n" : ""} a la organización`);

      handleClose();
      onSent();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  }

  const validCount   = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <UserPlus className="w-5 h-5 text-yelau-yellow" />
            Invitar usuarios
          </DialogTitle>
          <DialogDescription>
            Invita individualmente o importa un listado desde Excel o CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="manual"  className="flex-1 gap-1.5"><UserPlus className="w-3.5 h-3.5" />Manual</TabsTrigger>
            <TabsTrigger value="import"  className="flex-1 gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" />Importar archivo</TabsTrigger>
          </TabsList>

          {/* ── TAB MANUAL ── */}
          <TabsContent value="manual" className="mt-4">
            <form onSubmit={sendManual} className="space-y-5">
              <div className="space-y-2">
                <Label>Emails</Label>
                <div className="space-y-2">
                  {emails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={e => updateEmail(i, e.target.value)}
                        placeholder={`empleado${i + 1}@empresa.com`}
                        className="h-10 flex-1"
                      />
                      {emails.length > 1 && (
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => removeEmail(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {emails.length < 10 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addEmail} className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2">
                    <Plus className="w-3.5 h-3.5" /> Añadir otro email
                  </Button>
                )}
              </div>

              {/* Rol */}
              <div className="space-y-2">
                <Label>Rol</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`text-left p-3 rounded-lg border transition-colors ${role === r.value ? "border-yelau-yellow bg-yelau-yellow/10" : "border-border hover:border-muted-foreground/40"}`}>
                      <p className={`text-xs font-bold ${role === r.value ? "text-yelau-yellow" : "text-foreground"}`}>{r.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label>Departamento <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map(d => (
                    <button key={d.value} type="button" onClick={() => setDepartment(d.value)} className="focus:outline-none">
                      <Badge variant="outline" className={`cursor-pointer transition-colors text-xs px-3 py-1 ${department === d.value ? "border-yelau-yellow bg-yelau-yellow/10 text-yelau-yellow" : "hover:border-muted-foreground/40"}`}>
                        {d.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Enviando…" : "Enviar invitación"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              </div>
            </form>
          </TabsContent>

          {/* ── TAB IMPORTAR ── */}
          <TabsContent value="import" className="mt-4 space-y-4">

            {parsedRows.length === 0 ? (
              /* Drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging ? "border-yelau-yellow bg-yelau-yellow/5" : "border-border hover:border-yelau-yellow/50 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
                />
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-yelau-yellow animate-spin" />
                    <p className="text-sm font-medium text-foreground">Analizando archivo…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Arrastra tu archivo aquí</p>
                      <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionarlo</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">.xlsx · .xls · .csv</Badge>
                  </div>
                )}
              </div>
            ) : (
              /* Preview */
              <div className="space-y-3">
                {/* Resumen */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span><strong>{validCount}</strong> válidos</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span><strong>{invalidCount}</strong> con errores (no se enviarán)</span>
                    </div>
                  )}
                  <button onClick={() => setParsedRows([])} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="w-3 h-3" /> Cambiar archivo
                  </button>
                </div>

                {/* Formato hint */}
                <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  Puedes editar el rol y departamento por fila antes de enviar. Las filas en rojo tienen un email inválido.
                </p>

                {/* Tabla editable */}
                <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Email</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Rol</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Depto.</th>
                        <th className="px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.map((row, i) => (
                        <tr key={i} className={row.valid ? "" : "bg-red-500/5"}>
                          <td className="px-3 py-1.5">
                            <input
                              value={row.email}
                              onChange={e => updateRow(i, "email", e.target.value)}
                              className={`w-full bg-transparent outline-none text-xs ${row.valid ? "text-foreground" : "text-red-400"}`}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <select
                              value={row.role}
                              onChange={e => updateRow(i, "role", e.target.value)}
                              className="bg-transparent text-xs text-foreground outline-none"
                            >
                              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <select
                              value={row.department}
                              onChange={e => updateRow(i, "department", e.target.value)}
                              className="bg-transparent text-xs text-foreground outline-none"
                            >
                              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    disabled={loading || validCount === 0}
                    onClick={sendImport}
                    className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold gap-2 flex-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {loading ? "Enviando…" : `Enviar ${validCount} invitación${validCount !== 1 ? "es" : ""}`}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Plantilla descargable */}
            {parsedRows.length === 0 && (
              <div className="text-center">
                <button
                  onClick={() => {
                    const ws = XLSX.utils.aoa_to_sheet([
                      ["email", "rol", "departamento"],
                      ["empleado1@empresa.com", "Empleado", "Recepción"],
                      ["monitor1@empresa.com",  "Monitor",  "Monitor"],
                    ]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Invitaciones");
                    XLSX.writeFile(wb, "plantilla_invitaciones_fitacademy.xlsx");
                  }}
                  className="text-xs text-brand hover:underline flex items-center gap-1.5 mx-auto"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Descargar plantilla Excel de ejemplo
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
