"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

type State = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function PushToggle() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    // Verificar si ya hay una suscripción activa
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      setState(sub ? "subscribed" : "unsubscribed");
    }).catch(() => setState("unsubscribed"));
  }, []);

  async function enable() {
    setState("loading");
    try {
      // 1. Obtener clave pública VAPID
      const res = await fetch("/api/push/subscribe");
      if (!res.ok) { toast.error("Push no configurado en el servidor"); setState("unsubscribed"); return; }
      const { vapidPublicKey } = await res.json();

      // 2. Registrar service worker de push
      const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // 3. Pedir permiso y suscribir
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 4. Guardar suscripción en el servidor
      const subJson = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          endpoint: subJson.endpoint,
          keys:     subJson.keys,
        }),
      });

      setState("subscribed");
      toast.success("🔔 Notificaciones push activadas");
    } catch (e) {
      console.error(e);
      toast.error("Error al activar notificaciones");
      setState("unsubscribed");
    }
  }

  async function disable() {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("unsubscribed");
      toast.info("Notificaciones push desactivadas");
    } catch {
      toast.error("Error al desactivar notificaciones");
      setState("subscribed");
    }
  }

  if (state === "unsupported" || state === "denied") return null;

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Notificaciones…</span>
      </div>
    );
  }

  if (state === "subscribed") {
    return (
      <button
        onClick={disable}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-green-600 hover:bg-green-500/10 transition-colors"
      >
        <BellRing className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">Push activado</span>
      </button>
    );
  }

  return (
    <button
      onClick={enable}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Bell className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">Activar notificaciones</span>
    </button>
  );
}

// Convierte la clave VAPID base64url a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData  = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
