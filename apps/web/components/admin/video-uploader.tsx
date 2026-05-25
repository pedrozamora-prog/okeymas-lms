"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle2, Loader2, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  onUploadComplete: (uid: string) => void;
  currentUid?: string | null;
}

export function VideoUploader({ onUploadComplete, currentUid }: VideoUploaderProps) {
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [uploaded, setUploaded]     = useState(!!currentUid);
  const [uid, setUid]               = useState(currentUid ?? "");
  const [dragOver, setDragOver]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Solo se aceptan archivos de vídeo");
      return;
    }
    if (file.size > 10 * 1024 * 1024 * 1024) {
      toast.error("El vídeo no puede superar 10 GB");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 1. Obtener URL de subida de Cloudflare
      const res = await fetch("/api/admin/stream/upload-url", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      const { uploadURL, uid: videoUid } = await res.json();

      // 2. Subir el vídeo directamente a Cloudflare con XHR para tener progreso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", file);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Error al subir: ${xhr.statusText}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Error de red")));

        xhr.open("POST", uploadURL);
        xhr.send(form);
      });

      setUid(videoUid);
      setUploaded(true);
      onUploadComplete(videoUid);
      toast.success("Vídeo subido correctamente — Cloudflare lo está procesando");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al subir el vídeo");
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

  if (uploaded && uid) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Vídeo subido</p>
          <p className="text-xs text-muted-foreground font-mono truncate">{uid}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => { setUploaded(false); setUid(""); }}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-yelau-yellow bg-yelau-yellow/5"
            : "border-border hover:border-yelau-yellow/50 hover:bg-muted/30",
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
          accept="video/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-yelau-yellow animate-spin" />
            <p className="text-sm font-medium text-foreground">Subiendo vídeo... {progress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Video className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Arrastra el vídeo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, MOV, AVI · Máximo 10 GB
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
              Seleccionar vídeo
            </Button>
          </div>
        )}
      </div>

      {uploading && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
}
