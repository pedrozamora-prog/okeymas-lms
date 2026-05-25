"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface StreamPlayerProps {
  uid: string;
  title?: string;
}

function isCloudflareUid(value: string) {
  return !value.startsWith("http") && !value.includes("/") && value.length > 10;
}

function getEmbedUrl(videoUrl: string): string | null {
  if (isCloudflareUid(videoUrl)) {
    return `https://iframe.videodelivery.net/${videoUrl}`;
  }
  // YouTube
  const ytMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;

  // Vimeo
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export function StreamPlayer({ uid, title }: StreamPlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = getEmbedUrl(uid);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">URL de vídeo no válida</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 text-yelau-yellow animate-spin" />
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title ?? "Vídeo de la lección"}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
