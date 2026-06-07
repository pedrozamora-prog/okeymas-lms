"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Save, Sparkles, Award, Users, ImagePlus, X, ShoppingCart } from "lucide-react";
import { useRef } from "react";

interface DeptOption { id: string; name: string; }

interface CourseFormProps {
  initial?: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    status: string;
    isRequired: boolean;
    daysToComplete?: number | null;
    order: number;
    departments: string[];
    certificateEnabled: boolean;
    certificateType: string;
    certificateValidityDays: number | null;
    certSignerName: string | null;
    certSignerTitle: string | null;
    signatureEnabled: boolean;
    isPrl: boolean;
    prlRiskLevel: string | null;
    isPublic: boolean;
    price: number | null;
    currency: string;
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
  const [daysToComplete, setDays]   = useState(String(initial?.daysToComplete ?? ""));
  const [order, setOrder]           = useState(String(initial?.order ?? 0));
  const [loading, setLoading]             = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);
  const [imgLoading, setImgLoading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [departments, setDepts]           = useState<string[]>(initial?.departments ?? []);
  const [deptOptions, setDeptOptions]     = useState<DeptOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/departments")
      .then(r => r.json())
      .then(data => setDeptOptions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  const [certEnabled, setCertEnabled]     = useState(initial?.certificateEnabled ?? false);
  const [certType, setCertType]           = useState(initial?.certificateType ?? "COMPLETION");
  const [certValidity, setCertValidity]   = useState(String(initial?.certificateValidityDays ?? ""));
  const [signerName, setSignerName]       = useState(initial?.certSignerName ?? "");
  const [signerTitle, setSignerTitle]     = useState(initial?.certSignerTitle ?? "");
  const [sigEnabled, setSigEnabled]       = useState(initial?.signatureEnabled ?? false);
  const [isPrl, setIsPrl]               = useState(initial?.isPrl ?? false);
  const [prlRiskLevel, setPrlRiskLevel] = useState(initial?.prlRiskLevel ?? "BASICO");
  const [isPublic, setIsPublic]         = useState(initial?.isPublic ?? false);
  // price stored in euros as string, converted to cents on submit
  const [priceEur, setPriceEur]         = useState(
    initial?.price ? String((initial.price / 100).toFixed(2)) : ""
  );

  async function generateDescription() {
    if (!title.trim()) { toast.error("Escribe primero el título del curso"); return; }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "description", courseTitle: title }),
      });
      let data: { text?: string; error?: string } = {};
      try { data = await res.json(); } catch { /* HTML response */ }
      if (!res.ok) { toast.error(data.error ?? `Error ${res.status}`); return; }
      if (data.text) { setDesc(data.text); toast.success("Descripción generada"); }
      else toast.error(data.error ?? "No se generó texto");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de red");
    } finally {
      setAiLoading(false);
    }
  }

  function cropTo16x9(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const W = 1280, H = 720;
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas no disponible")); return; }
        // object-cover: escalar para cubrir, luego centrar
        const scale = Math.max(W / img.width, H / img.height);
        const sw = img.width * scale, sh = img.height * scale;
        ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("Error al procesar imagen")), "image/jpeg", 0.92);
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = objectUrl;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected if upload fails
    e.target.value = "";
    setImgLoading(true);
    try {
      const blob = await cropTo16x9(file);
      const form = new FormData();
      form.append("file", blob, "thumbnail.jpg");
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
          daysToComplete: daysToComplete ? Number(daysToComplete) : null,
          departments,
          certificateEnabled: certEnabled,
          certificateType: certType,
          certificateValidityDays: certValidity ? Number(certValidity) : null,
          certSignerName:  signerName  || null,
          certSignerTitle: signerTitle || null,
          signatureEnabled: sigEnabled,
          isPrl,
          prlRiskLevel: isPrl ? prlRiskLevel : null,
          isPublic,
          price:    isPublic && priceEur ? Math.round(parseFloat(priceEur) * 100) : null,
          currency: "eur",
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
                className="flex items-center gap-1.5 text-xs text-brand hover:text-amber-600 transition-colors disabled:opacity-50"
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
                  className="relative w-full h-44 rounded-lg overflow-hidden border border-border block cursor-pointer"
                  title="Clic para cambiar imagen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbnailUrl} alt="Portada del curso" className="w-full h-full object-cover" />
                  {imgLoading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                    className="flex items-center gap-1.5 border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
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
                className="w-full h-44 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                {imgLoading
                  ? <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                  <SelectItem value="true">Sí — formación obligatoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Días para completar */}
            {isRequired && (
              <div className="space-y-1.5">
                <Label htmlFor="daysToComplete">Días para completar</Label>
                <Input
                  id="daysToComplete"
                  type="number"
                  min={1}
                  placeholder="Sin límite"
                  value={daysToComplete}
                  onChange={e => setDays(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Días desde la inscripción para completarlo. Vacío = sin límite.
                </p>
              </div>
            )}

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
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Departamentos</h3>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Selecciona a qué departamentos va dirigido este curso. Si no marcas ninguno, será visible para todos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {deptOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground col-span-full">Cargando departamentos…</p>
            ) : deptOptions.map(d => {
              const checked = departments.includes(d.id);
              return (
                <label
                  key={d.id}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={checked}
                    onChange={() =>
                      setDepts(prev =>
                        checked ? prev.filter(v => v !== d.id) : [...prev, d.id]
                      )
                    }
                  />
                  <span className="text-sm font-medium">{d.name}</span>
                </label>
              );
            })}
          </div>
          {departments.length === 0 && (
            <p className="text-xs text-brand bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Sin restricción — visible para todos los departamentos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Certificado */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Certificado</h3>
          </div>

          {/* Toggle certificado */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Emitir certificado al completar</p>
              <p className="text-xs text-muted-foreground mt-0.5">El alumno recibirá un certificado al finalizar el 100% del curso</p>
            </div>
            <button
              type="button"
              onClick={() => setCertEnabled(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                certEnabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                certEnabled ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Toggle firma digital */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
            <div>
              <p className="text-sm font-medium text-foreground">Requerir firma digital al completar</p>
              <p className="text-xs text-muted-foreground mt-0.5">El empleado debe firmar digitalmente que ha leído y entendido el curso (compliance)</p>
            </div>
            <button
              type="button"
              onClick={() => setSigEnabled(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                sigEnabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                sigEnabled ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Toggle PRL */}
          <div className={`flex items-start justify-between p-4 rounded-lg border-2 transition-colors ${isPrl ? "border-orange-400 bg-orange-50/50" : "border-border bg-muted/30"}`}>
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Formación PRL — Prevención de Riesgos Laborales</p>
                {isPrl && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">Obligatorio por ley</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Marca este curso como formación obligatoria según la Ley 31/1995. Aparecerá en el dashboard de cumplimiento PRL.</p>
              {isPrl && (
                <div className="mt-3 flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground whitespace-nowrap">Nivel de riesgo:</p>
                  {["BASICO", "ESPECIFICO", "DIRECTIVO"].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPrlRiskLevel(level)}
                      className={`text-[11px] px-3 py-1 rounded-full border font-medium transition-colors ${
                        prlRiskLevel === level
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-border text-muted-foreground hover:border-orange-300"
                      }`}
                    >
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsPrl(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${isPrl ? "bg-orange-500" : "bg-muted-foreground/30"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPrl ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Toggle venta pública B2C */}
          <div className={`flex items-start justify-between p-4 rounded-lg border-2 transition-colors ${isPublic ? "border-[#A855F7] bg-[#A855F7]/5" : "border-border bg-muted/30"}`}>
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#A855F7]" />
                <p className="text-sm font-semibold text-foreground">Vender al público</p>
                {isPublic && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30">B2C activo</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                El curso aparecerá en el catálogo público <strong>/cursos</strong> y cualquier persona podrá comprarlo con tarjeta.
              </p>
              {isPublic && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Precio de venta (€)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">€</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="29.00"
                      value={priceEur}
                      onChange={e => setPriceEur(e.target.value)}
                      className="w-28 bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-xs text-muted-foreground">IVA no incluido</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    El comprador recibirá credenciales de acceso automáticamente tras el pago.
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${isPublic ? "bg-[#A855F7]" : "bg-muted-foreground/30"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
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
          className="bg-primary text-yelau-black hover:bg-primary/90 font-bold"
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
