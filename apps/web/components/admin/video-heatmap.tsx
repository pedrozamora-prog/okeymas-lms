"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Clock, TrendingDown, Rewind } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchSession {
  watchedSegments: number[][];
  totalWatchTime:  number;
  maxProgress:     number;
  rewatchCount:    number;
  playbackSpeeds:  number[];
}

interface VideoHeatmapProps {
  lessonId: string;
  duration?: number; // segundos totales del vídeo (opcional, se estima de los datos)
}

const BUCKET_COUNT = 50; // resolución del heatmap

export function VideoHeatmap({ lessonId, duration: propDuration }: VideoHeatmapProps) {
  const [sessions, setSessions] = useState<WatchSession[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/watch-session`)
      .then(r => r.json())
      .then(d => { setSessions(d.sessions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lessonId]);

  const stats = useMemo(() => {
    if (!sessions.length) return null;

    // Estimar duración del vídeo desde los datos si no viene como prop
    const maxEnd = sessions.flatMap(s => s.watchedSegments).reduce(
      (m, [, e]) => Math.max(m, e), propDuration ?? 0
    );
    const duration = propDuration ?? maxEnd;
    if (!duration) return null;

    const bucketSize = duration / BUCKET_COUNT;

    // Para cada bucket, contar cuántos usuarios lo vieron
    const heatmap = Array.from({ length: BUCKET_COUNT }, (_, i) => {
      const bucketStart = i * bucketSize;
      const bucketEnd   = bucketStart + bucketSize;
      const viewers = sessions.filter(s =>
        s.watchedSegments.some(([a, b]) => a < bucketEnd && b > bucketStart)
      ).length;
      return { bucket: i, viewers, pct: sessions.length > 0 ? (viewers / sessions.length) * 100 : 0 };
    });

    const avgWatchTime   = sessions.reduce((s, x) => s + x.totalWatchTime, 0) / sessions.length;
    const avgCompletion  = sessions.reduce((s, x) => s + x.maxProgress, 0)  / sessions.length;
    const totalRewatches = sessions.reduce((s, x) => s + x.rewatchCount, 0);
    const avgSpeed       = sessions
      .flatMap(s => s.playbackSpeeds)
      .reduce((s, v, _, a) => s + v / a.length, 0);

    // Drop-off: primer bucket con < 40% viewers respecto al pico
    const peakViewers = Math.max(...heatmap.map(b => b.viewers));
    const dropOffBucket = heatmap.find(b => b.bucket > 5 && b.viewers < peakViewers * 0.4);

    return { heatmap, avgWatchTime, avgCompletion, totalRewatches, avgSpeed, dropOffBucket, duration, bucketSize };
  }, [sessions, propDuration]);

  if (loading) return <div className="h-32 animate-pulse bg-muted rounded-lg" />;
  if (!sessions.length) return (
    <div className="text-sm text-muted-foreground text-center py-8">
      Sin datos de visionado todavía
    </div>
  );
  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Stats resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Eye,         label: "Alumnos",        value: String(sessions.length) },
          { icon: Clock,       label: "Tiempo medio",   value: `${Math.round(stats.avgWatchTime / 60)}m` },
          { icon: TrendingDown,label: "Compleción media",value: `${Math.round(stats.avgCompletion)}%` },
          { icon: Rewind,      label: "Retrocesos",      value: String(stats.totalRewatches) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 flex flex-col items-center text-center gap-1">
              <Icon className="w-4 h-4 text-primary" />
              <p className="text-lg font-black text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Mapa de atención del vídeo</CardTitle>
          <p className="text-xs text-muted-foreground">
            Cada barra muestra qué % de alumnos vio ese segmento. Rojo = zona abandonada.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-px h-20 w-full">
            {stats.heatmap.map(({ bucket, pct }) => (
              <div
                key={bucket}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.max(4, pct)}%`,
                  background: pct > 70
                    ? "hsl(var(--primary, 270 91% 65%))"
                    : pct > 40
                    ? "#fb923c"
                    : "#ef4444",
                  opacity: 0.7 + pct / 300,
                }}
                title={`${Math.round(bucket * stats.bucketSize / 60)}m — ${Math.round(pct)}% vio este segmento`}
              />
            ))}
          </div>
          {/* Eje de tiempo */}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0:00</span>
            <span>{Math.round(stats.duration / 60 / 2)}:{String(Math.round((stats.duration / 2) % 60)).padStart(2,"0")}</span>
            <span>{Math.floor(stats.duration / 60)}:{String(stats.duration % 60).padStart(2,"0")}</span>
          </div>

          {/* Drop-off warning */}
          {stats.dropOffBucket && (
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 rounded-md px-3 py-2">
              <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Abandono notable en{" "}
                <strong>{Math.round(stats.dropOffBucket.bucket * stats.bucketSize / 60)}:{String(Math.round(stats.dropOffBucket.bucket * stats.bucketSize % 60)).padStart(2,"0")}</strong>
                {" "}— considera acortar o mejorar ese tramo
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary/70 inline-block" /> Alto engagement (&gt;70%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-400/70 inline-block" /> Medio (40-70%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500/70 inline-block" /> Abandono (&lt;40%)
        </span>
      </div>
    </div>
  );
}
