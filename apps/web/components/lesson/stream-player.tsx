"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface StreamPlayerProps {
  uid:          string;
  title?:       string;
  onEnded?:     () => void;
  onProgress?:  (pct: number) => void;
  onTimeUpdate?: (currentSeconds: number, duration: number) => void; // Para analytics e interactivo
}

function isCloudflareUid(value: string) {
  return !value.startsWith("http") && !value.includes("/") && value.length > 10;
}

function getEmbedUrl(videoUrl: string): { url: string; provider: "cloudflare" | "youtube" | "vimeo" | "other" } | null {
  if (isCloudflareUid(videoUrl)) {
    return {
      // enablejsapi=1 activa los eventos postMessage de Cloudflare Stream
      url:      `https://iframe.videodelivery.net/${videoUrl}?preload=true&primaryColor=%23FCE900`,
      provider: "cloudflare",
    };
  }
  const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return {
    url:      `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&enablejsapi=1`,
    provider: "youtube",
  };

  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return {
    url:      `https://player.vimeo.com/video/${vimeoMatch[1]}?api=1`,
    provider: "vimeo",
  };

  return null;
}

export function StreamPlayer({ uid, title, onEnded, onProgress, onTimeUpdate }: StreamPlayerProps) {
  const [loaded,    setLoaded]    = useState(false);
  const [completed, setCompleted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const durationRef = useRef<number>(0);

  const embed = getEmbedUrl(uid);

  /* ── Escucha eventos postMessage de Cloudflare Stream ── */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      // Cloudflare Stream eventos
      if (data?.type === "ended" || data?.event === "ended") {
        if (!completed) {
          setCompleted(true);
          onEnded?.();
        }
        return;
      }

      if (data?.type === "durationchange") {
        durationRef.current = data.duration ?? 0;
      }

      if (data?.type === "timeupdate" && durationRef.current > 0) {
        const pct = Math.round((data.currentTime / durationRef.current) * 100);
        onProgress?.(pct);
        onTimeUpdate?.(Math.floor(data.currentTime ?? 0), Math.floor(durationRef.current));
        // Auto-completar al 90% del vídeo
        if (pct >= 90 && !completed) {
          setCompleted(true);
          onEnded?.();
        }
      }

      // YouTube eventos
      if (data?.event === "infoDelivery" && data?.info?.playerState === 0) {
        if (!completed) { setCompleted(true); onEnded?.(); }
      }

      // Vimeo eventos
      if (data?.event === "finish") {
        if (!completed) { setCompleted(true); onEnded?.(); }
      }
    } catch {
      // Ignorar mensajes no JSON
    }
  }, [completed, onEnded, onProgress]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  /* ── Enviar comando play a Cloudflare para activar eventos ── */
  useEffect(() => {
    if (!loaded || !iframeRef.current || embed?.provider !== "cloudflare") return;
    // Necesario para que Cloudflare envíe eventos postMessage
    iframeRef.current.contentWindow?.postMessage(JSON.stringify({ type: "addEventListener", event: "ended" }), "*");
    iframeRef.current.contentWindow?.postMessage(JSON.stringify({ type: "addEventListener", event: "timeupdate" }), "*");
    iframeRef.current.contentWindow?.postMessage(JSON.stringify({ type: "addEventListener", event: "durationchange" }), "*");
  }, [loaded, embed?.provider]);

  if (!embed) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">URL de vídeo no válida</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embed.url}
          title={title ?? "Vídeo de la lección"}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          onLoad={() => setLoaded(true)}
        />

        {/* Indicador de completado */}
        {completed && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Lección completada
          </div>
        )}
      </div>
    </div>
  );
}
