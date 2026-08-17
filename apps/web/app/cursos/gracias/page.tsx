"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Anton } from "next/font/google";
import { CheckCircle2, BookOpen, Loader2, Mail } from "lucide-react";

const anton = Anton({ weight: "400", subsets: ["latin"] });

function GraciasContent() {
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("session_id");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Small delay to let webhook process
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!sessionId) {
    return (
      <div className="text-center py-24">
        <p className="text-white/40">Sesión no encontrada.</p>
        <Link href="/cursos" className="text-[#A855F7] hover:underline mt-4 inline-block text-sm">
          Ver catálogo de cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center px-4 py-20">
      {!ready ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#A855F7] animate-spin" />
          <p className="text-white/60">Confirmando tu pago…</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#A855F7]" />
            </div>
          </div>

          <div>
            <h1 className={`${anton.className} text-4xl text-white mb-3`}>
              ¡Pago confirmado!
            </h1>
            <p className="text-white/60 text-lg">
              Tu acceso al curso está listo. Revisa tu email para encontrar las credenciales de acceso.
            </p>
          </div>

          {/* Steps */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">Próximos pasos</h2>
            {[
              { icon: Mail,        step: "1", text: "Revisa tu bandeja de entrada — te hemos enviado las credenciales de acceso." },
              { icon: BookOpen,    step: "2", text: "Inicia sesión en la plataforma con tu email y la contraseña temporal." },
              { icon: CheckCircle2, step: "3", text: "Empieza el curso y obtén tu certificado al completarlo." },
            ].map(({ icon: Icon, step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#A855F7]" />
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#A855F7] hover:bg-[#9333ea] text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm"
            >
              Ir a la plataforma →
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-medium py-3 px-6 rounded-lg transition-colors text-sm"
            >
              Ver más cursos
            </Link>
          </div>

          <p className="text-white/30 text-xs">
            ¿Problemas? Contacta con nosotros en{" "}
            <a href="mailto:soporte@formia.app" className="text-[#A855F7] hover:underline">
              soporte@formia.app
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0C]">
      {/* Nav */}
      <header className="border-b border-white/10 bg-[#0C0C0C]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className={`${anton.className} text-xl`}>
            <span className="text-white">Formia</span>
          </Link>
        </div>
      </header>

      <Suspense fallback={
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#A855F7]" />
        </div>
      }>
        <GraciasContent />
      </Suspense>
    </div>
  );
}
