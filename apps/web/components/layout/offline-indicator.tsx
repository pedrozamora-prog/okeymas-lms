"use client";

import { useState, useEffect, useCallback } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline,  setIsOnline]  = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [pending,   setPending]   = useState(0);
  const [justSynced, setJustSynced] = useState(false);

  const syncQueue = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      // Dynamic import to avoid SSR issues
      const { flushProgressQueue, getPendingCount } = await import("@/lib/offline-db");
      const { flushed } = await flushProgressQueue();
      const remaining   = await getPendingCount();
      setPending(remaining);
      if (flushed > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      await syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    // Verificar pendientes al montar
    import("@/lib/offline-db").then(({ getPendingCount }) =>
      getPendingCount().then(setPending)
    ).catch(() => {});

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  // Modo offline: banner permanente
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-orange-500/40 text-orange-400 text-xs font-medium px-4 py-2.5 rounded-full shadow-lg backdrop-blur-sm">
        <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
        Sin conexión — trabajando en modo offline
        {pending > 0 && (
          <span className="ml-1 bg-orange-500/20 text-orange-300 text-[10px] px-1.5 py-0.5 rounded-full">
            {pending} pendiente{pending !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }

  // Online con sincronización pendiente
  if (pending > 0 || syncing) {
    return (
      <div
        onClick={syncQueue}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border text-muted-foreground text-xs font-medium px-4 py-2.5 rounded-full shadow-lg cursor-pointer hover:border-primary/40 transition-colors"
      >
        <RefreshCw className={cn("w-3.5 h-3.5 flex-shrink-0", syncing && "animate-spin text-primary")} />
        {syncing ? "Sincronizando progreso…" : `${pending} progreso pendiente de sync`}
      </div>
    );
  }

  // Recién sincronizado — feedback breve
  if (justSynced) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-green-500/30 text-green-400 text-xs font-medium px-4 py-2.5 rounded-full shadow-lg">
        <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
        Progreso sincronizado
      </div>
    );
  }

  return null;
}
