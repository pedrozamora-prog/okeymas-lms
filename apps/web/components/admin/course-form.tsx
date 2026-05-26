"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Sparkles, Award, Users, ImagePlus, X } from "lucide-react";
import { useRef } from "react";

const DEPARTMENTS = [
  { value: "ADMINISTRACION", label: "Administración" },
  { value: "RECEPCION",      label: "Recepción" },
  { value: "LIMPIEZA",       label: "Servicio de Limpieza" },
  { value: "MONITOR",        label: "Monitor" },
  { value: "DEPORTIVO",      label: "Deporocio" },
];

interface CourseFormProps {
  initial?: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    status: string;
    isRequired: boolean;
    order: number;
    departments: string[];
    certificateEnabled: boolean;
    certificateType: string;
    certificateValidityDays: number | null;
    certSignerName: string | null;
    certSignerTitle: string | null;
  };
}

export function CourseForm({ initial }: CourseFormProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle]           = useState(initial?.title ?? "");
  const [description, setDesc]      = useState(initial?.description ?? "");
  const [thumbnailUrl, setThumb]    = useState(initial?.thumbnailUrl ?? "");
  const [status, setStatus]         = useState(initial?.status ?? "DRAFT");
  const [isRequired, setRequired]   = useState(initial?.isRequired ?? false);
  const [order, setOrder]           = useState(String(initial?.order ?? 0));
  const [loading, setLoading]             = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);
  const [imgLoading, setImgLoading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [departments, setDepts]           = useState<string[]>(initial?.departments ?? []);
  const [certEnabled, setCertEnabled]     = useState(initial?.certificateEnabled ?? false);
  const [certType, setCertType]           = useState(initial?.certificateType ?? "COMPLETION");
  const [certValidity, setCertValidity]   = useState(String(initial?.certificateValidityDays ?? ""));
  const [signerName, setSignerName]       = useState(initial?.certSignerName ?? "");
  const [signerTitle, setSignerTitle]     = useState(initial?.certSignerTitle ?? "");

  async function generateDescription() {
    if (!title.trim()) { toast.error("Escribe primero el título del curso"); return; }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "description", courseTitle: title }),
      });
      const data = await res.json();
      if (data.text) { setDesc(data.text); toast.success("Descripción generada"); }
    } catch {
      toast.error("Error al generar descripción");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected if upload fails
    e.target.value = "";
    setImgLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/admin/upload", { method: "POST", body: form });
      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* response not JSON */ }
      if (!res.ok) {
        toast.error(data.error ?? `Error ${res.status} al subir imagen`);
        return;
      }
      if (!data.url) { toast.error("El servidor no devolvió la URL"); return; }
      setThumb(data.url);
      toast.success("Imagen subida correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de red al subir imagen");
    } finally {
      setImgLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("El título es obligatorio"); return; }
    setLoading(true);

    try {
      const url = isEdit ? `/api/admin/courses/${initial.id}` : "/api/admin/courses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, thumbnailUrl, status, isRequired, order: Number(order),
          departments,
          certificateEnabled: certEnabled,
          certificateType: certType,
          certificateValidityDays: certValidity ? Number(certValidity) : null,
          certSignerName:  signerName  || null,
          certSignerTitle: signerTitle || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }

      const course = await res.json();
      toast.success(isEdit ? "Curso actualizado" : "Curso creado");
      router.push(`/admin/courses/${course.id}/edit`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Título del curso <span className="text-red-400">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Seguridad e Higiene en el Gimnasio"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Descripción</Label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs text-yelau-yellow hover:text-yelau-yellow/80 transition-colors disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Generar con IA
              </button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe de qué trata el curso..."
              rows={3}
            />
          </div>

          {/* Imagen de portada */}
          <div className="space-y-1.5">
            <Label>Imagen de portada</Label>
            <p className="text-[11px] text-muted-foreground">
              Recomendado: 1280×720 px (16:9) · JPG, PNG o WEBP · Máx. 3 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />
            {thumbnailUrl ? (
              <div className="space-y-2">
                {/* Image preview — click anywhere on it to change */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imgLoading}
                  className="relative w-full aspect-video rounded-lg overflow-hidden border border-border block cursor-pointer"
                  title="Clic para cambiar imagen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl} alt="Portada del curso" className="w-full h-full object-cover" />
                  {imgLoading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-yelau-yellow" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-end justify-start p-2">
                    <span className="text-[10px] text-white/0 hover:text-white/80 bg-black/40 rounded px-1.5 py-0.5 transition-colors">
                      Clic para cambiar
                    </span>
                  </div>
                </button>
                {/* Action buttons always visible below */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imgLoading}
                    className="flex items-center gap-1.5 border border-border hover:border-yelau-yellow/50 text-muted-foreground hover:text-foreground text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Cambiar imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumb("")}
                    disabled={imgLoading}
                    className="flex items-center gap-1.5 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imgLoading}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-yelau-yellow/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                {imgLoading
                  ? <Loader2 className="w-8 h-8 animate-spin text-yelau-yellow" />
                  : <>
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-medium">Haz clic para subir imagen</span>
                      <span className="text-xs">1280×720 recomendado</span>
                    </>
                }
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Estado */}
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                  <SelectItem value="ARCHIVED">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Obligatorio */}
            <div className="space-y-1.5">
              <Label>¿Obligatorio?</Label>
              <Select value={isRequired ? "true" : "false"} onValueChange={v => setRequired(v === "true")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orden */}
            <div className="space-y-1.5">
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                min={0}
                value={order}
                onChange={e => setOrder(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departamentos */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-yelau-yellow" />
            <h3 className="text-sm font-bold text-foreground">Departamentos</h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Selecciona a qué departamentos va dirigido este curso. Si no marcas ninguno, será visible para todos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DEPARTMENTS.map(d => {
              const checked = departments.includes(d.value);
              return (
                <label
                  key={d.value}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? "border-yelau-yellow bg-yelau-yellow/10 text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:border-yelau-yellow/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-yelau-yellow"
                    checked={checked}
                    onChange={() =>
                      setDepts(prev =>
                        checked ? prev.filter(v => v !== d.value) : [...prev, d.value]
                      )
                    }
                  />
                  <span className="text-sm font-medium">{d.label}</span>
                </label>
              );
            })}
          </div>
          {departments.length === 0 && (
            <p className="text-xs text-yelau-yellow/70 bg-yelau-yellow/5 border border-yelau-yellow/20 rounded-md px-3 py-2">
              Sin restricción — visible para todos los departamentos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Certificado */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-yelau-yellow" />
            <h3 className="text-sm font-bold text-foreground">Certificado</h3>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Emitir certificado al completar</p>
              <p className="text-xs text-muted-foreground mt-0.5">El alumno recibirá un certificado al finalizar el 100% del curso</p>
            </div>
            <button
              type="button"
              onClick={() => setCertEnabled(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                certEnabled ? "bg-yelau-yellow" : "bg-muted-foreground/30"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                certEnabled ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {certEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo de certificado</Label>
                  <Select value={certType} onValueChange={setCertType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETION">Finalización</SelectItem>
                      <SelectItem value="PROFESSIONAL">Profesional</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {certType === "PROFESSIONAL"
                      ? "Acredita competencias profesionales reconocidas"
                      : "Confirma que el alumno ha completado el curso"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cert-validity">Validez (días)</Label>
                  <Input
                    id="cert-validity"
                    type="number"
                    min={1}
                    value={certValidity}
                    onChange={e => setCertValidity(e.target.value)}
                    placeholder="Sin caducidad"
                  />
                  <p className="text-[11px] text-muted-foreground">Dejar vacío = sin fecha de caducidad</p>
                </div>
              </div>

              {/* Datos del firmante */}
              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Firmante del certificado</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signer-name">Nombre del firmante</Label>
                    <Input
                      id="signer-name"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      placeholder="Ej: Pedro Zamora"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signer-title">Cargo</Label>
                    <Input
                      id="signer-title"
                      value={signerTitle}
                      onChange={e => setSignerTitle(e.target.value)}
                      placeholder="Ej: Director de Formación"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="bg-yelau-yellow text-yelau-black hover:bg-yelau-yellow/90 font-bold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Guardar cambios" : "Crear curso"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
