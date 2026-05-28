"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, FileText, Download, Filter } from "lucide-react";
import { toast } from "sonner";

const DEPTS = [
  { value: "",              label: "Todos los departamentos" },
  { value: "ADMINISTRACION",label: "Administración" },
  { value: "RECEPCION",     label: "Recepción" },
  { value: "LIMPIEZA",      label: "Limpieza" },
  { value: "MONITOR",       label: "Monitor" },
  { value: "DEPORTIVO",     label: "Deportivo" },
];

export function ReportExport() {
  const [dept, setDept]   = useState("");
  const [from, setFrom]   = useState("");
  const [to, setTo]       = useState("");
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);

  function buildUrl(format: "excel" | "pdf") {
    const params = new URLSearchParams({ format });
    if (dept) params.set("dept", dept);
    if (from) params.set("from", from);
    if (to)   params.set("to", to);
    return `/api/admin/reports/export?${params.toString()}`;
  }

  async function handleDownload(format: "excel" | "pdf") {
    setLoading(format);
    try {
      const res = await fetch(buildUrl(format));
      if (!res.ok) throw new Error("Error al generar el informe");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ?? `informe.${format === "excel" ? "xlsx" : "pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Informe ${format === "excel" ? "Excel" : "PDF"} descargado`);
    } catch {
      toast.error("Error al generar el informe");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5 space-y-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-yelau-yellow" />
          <p className="text-sm font-semibold text-foreground">Filtros del informe</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Departamento */}
          <div className="space-y-1.5">
            <Label className="text-xs">Departamento</Label>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {DEPTS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desde */}
          <div className="space-y-1.5">
            <Label htmlFor="from" className="text-xs">Inscripción desde</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>

          {/* Hasta */}
          <div className="space-y-1.5">
            <Label htmlFor="to" className="text-xs">Inscripción hasta</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            onClick={() => handleDownload("excel")}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
          >
            {loading === "excel"
              ? <Download className="w-4 h-4 animate-bounce" />
              : <FileSpreadsheet className="w-4 h-4" />
            }
            Descargar Excel
          </Button>

          <Button
            onClick={() => handleDownload("pdf")}
            disabled={loading !== null}
            variant="outline"
            className="gap-2 font-semibold"
          >
            {loading === "pdf"
              ? <Download className="w-4 h-4 animate-bounce" />
              : <FileText className="w-4 h-4" />
            }
            Descargar PDF
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          El Excel incluye 3 hojas: cumplimiento por empleado, detalle de inscripciones y resumen por departamento.
        </p>
      </CardContent>
    </Card>
  );
}
