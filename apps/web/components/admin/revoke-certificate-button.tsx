"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function RevokeCertificateButton({ certId }: { certId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm("¿Revocar este certificado? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: certId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Certificado revocado");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al revocar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={loading}
      title="Revocar certificado"
      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  );
}
