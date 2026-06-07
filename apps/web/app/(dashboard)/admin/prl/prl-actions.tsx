"use client";

import { useState } from "react";
import { FileDown, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrlActions({ orgId, hasAlerts }: { orgId: string; hasAlerts: boolean }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  async function sendAlerts() {
    setSending(true);
    try {
      await fetch("/api/prl/send-alerts", { method: "POST" });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <a href="/api/prl/report" target="_blank">
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="w-4 h-4" />
          Exportar acta PDF
        </Button>
      </a>

      {hasAlerts && (
        <Button
          size="sm"
          onClick={sendAlerts}
          disabled={sending || sent}
          className="gap-2"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {sent ? "¡Alertas enviadas!" : "Enviar recordatorios"}
        </Button>
      )}
    </div>
  );
}
