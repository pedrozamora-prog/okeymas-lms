"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Loader2, FileText, X, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUploadComplete: (url: string, name: string) => void;
  currentUrl?:      string | null;
  currentName?:     string | null;
  accept?:          string;        // "application/pdf" etc.
  type?:            "pdf" | "image" | "doc";
  label?:           string;
  maxMB?:           number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileUploader({
  onUploadComplete,
  currentUrl,
  currentName,
  accept  = "application/pdf",
  type    = "pdf",
  label   = "PDF",
  maxMB   = 50,
}: FileUploaderProps) {
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [uploaded,   setUploaded]   = useState(!!currentUrl);
  const [fileUrl,    setFileUrl]    = useState(currentUrl ?? "");
  const [fileName,   setFileName]   = useState(currentName ?? "");
  const [dragOver,   setDragOver]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`El archivo supera el límite de ${maxMB} MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    // Simula progreso mientras sube (XHR no disponible fácilmente con FormData + fetch)
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 85));
    }, 300);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);

      const res = await fetch("/api/admin/storage/upload", {
        method: "POST",
        body:   form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");

      clearInterval(interval);
      setProgress(100);

      setFileUrl(data.url);
      setFileName(file.name);
      setUploaded(true);
      onUploadComplete(data.url, file.name);
      toast.success(`${label} subido correctamente`);
    } catch (e: unknown) {
      clearInterval(interval);
      toast.error(e instanceof Error ? e.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  /* ── Estado: archivo subido ── */
  if (uploaded && fileUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <p className="text-sm font-medium text-foreground truncate">
              {fileName || label + " subido"}
            </p>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand hover:underline truncate block mt-0.5"
          >
            Ver archivo →
          </a>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => { setUploaded(false); setFileUrl(""); setFileName(""); }}
          title="Cambiar archivo"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  /* ── Estado: zona de upload ── */
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }}
        />

        {uploading ? (
          <div className="space-y-2 py-2">
            <Loader2 className="w-7 h-7 mx-auto text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Subiendo {label}… {Math.round(progress)}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-muted mx-auto flex items-center justify-center">
              <File className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Arrastra el {label} aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept.includes("pdf") ? "PDF" : label} · Máximo {maxMB} MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <Upload className="w-3.5 h-3.5" />
              Seleccionar {label}
            </Button>
          </div>
        )}
      </div>

      {uploading && <Progress value={progress} className="h-1.5" />}
    </div>
  );
}
