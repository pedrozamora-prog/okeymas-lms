"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Video, Clock } from "lucide-react";

interface JoinClassButtonProps {
  liveClassId: string;
  roomUrl: string | null;
  isLive: boolean;
  scheduledAt: string;
}

export function JoinClassButton({ liveClassId, roomUrl, isLive, scheduledAt }: JoinClassButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!roomUrl) {
      toast.info("Sala no disponible aún", { description: "El instructor abrirá la sala en breve." });
      return;
    }
    setLoading(true);
    try {
      await fetch(`/api/live-classes/${liveClassId}/attend`, { method: "POST" });
      window.open(roomUrl, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  if (!isLive) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Clock className="w-3.5 h-3.5" />
        {new Date(scheduledAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
      </Button>
    );
  }

  return (
    <Button onClick={handleJoin} disabled={loading} size="sm" className="w-full">
      <Video className="w-3.5 h-3.5" />
      {loading ? "Conectando..." : "Unirse a la clase"}
    </Button>
  );
}
