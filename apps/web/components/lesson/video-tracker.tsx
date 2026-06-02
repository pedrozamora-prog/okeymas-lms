"use client";

import { useRef, useCallback } from "react";
import { StreamPlayer } from "./stream-player";

interface VideoTrackerProps {
  uid:          string;
  title?:       string;
  lessonId:     string;
  onEnded?:     () => void;
  onProgress?:  (pct: number) => void;
  onTimeUpdate?: (seconds: number, duration: number) => void;
}

const HEARTBEAT_INTERVAL = 5; // segundos entre envíos

export function VideoTracker({ uid, title, lessonId, onEnded, onProgress, onTimeUpdate }: VideoTrackerProps) {
  const lastSentRef     = useRef<number>(-1);
  const durationRef     = useRef<number>(0);
  const playbackSpeed   = useRef<number>(1);
  const pendingRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendHeartbeat = useCallback((second: number) => {
    if (durationRef.current <= 0) return;
    fetch(`/api/lessons/${lessonId}/watch-session`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        currentSecond: second,
        duration:      durationRef.current,
        playbackSpeed: playbackSpeed.current,
      }),
    }).catch(() => {}); // fire and forget
  }, [lessonId]);

  const handleTimeUpdate = useCallback((currentSeconds: number, duration: number) => {
    durationRef.current = duration;
    onTimeUpdate?.(currentSeconds, duration);

    // Enviar heartbeat cada HEARTBEAT_INTERVAL segundos únicos
    const bucket = Math.floor(currentSeconds / HEARTBEAT_INTERVAL) * HEARTBEAT_INTERVAL;
    if (bucket !== lastSentRef.current) {
      lastSentRef.current = bucket;
      // Debounce para evitar envíos en rafaga al hacer seek
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => sendHeartbeat(bucket), 300);
    }
  }, [onTimeUpdate, sendHeartbeat]);

  return (
    <StreamPlayer
      uid={uid}
      title={title}
      onEnded={onEnded}
      onProgress={onProgress}
      onTimeUpdate={handleTimeUpdate}
    />
  );
}
