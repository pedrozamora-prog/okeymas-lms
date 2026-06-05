"use client";

import { useState } from "react";
import { SignatureCanvas } from "./signature-canvas";
import { PenLine, ShieldCheck, Loader2 } from "lucide-react";

interface SignatureModalProps {
  courseId: string;
  courseTitle: string;
  onComplete: (certificateIssued: boolean) => void;
}

export function SignatureModal({ courseId, courseTitle, onComplete }: SignatureModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  async function handleSign(signatureData: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar la firma");
      onComplete(data.certificateIssued ?? false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <PenLine className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Acuse de recibo</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Has completado <span className="font-semibold text-foreground">"{courseTitle}"</span>.
              Firma para confirmar que has leído y entendido el contenido.
            </p>
          </div>
        </div>

        {/* Aviso legal */}
        <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Al firmar, confirmas que has completado la formación y que conoces su contenido.
            Esta firma tiene validez como acuse de recibo interno.
            Se registrarán la fecha, hora y dirección IP de la firma.
          </p>
        </div>

        {/* Canvas */}
        {submitting ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Guardando firma…</p>
          </div>
        ) : (
          <SignatureCanvas onSign={handleSign} disabled={submitting} />
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
