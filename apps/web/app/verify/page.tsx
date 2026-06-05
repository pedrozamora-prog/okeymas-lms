"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, Award, FileText, Users } from "lucide-react";

export default function VerifyPage() {
  const [code, setCode]   = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/\s/g, "");
    if (clean.length < 8) { setError("Introduce el código completo del certificado"); return; }
    router.push(`/verify/${clean}`);
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col">

      {/* Header */}
      <header className="bg-[#0C0C0C] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <img src="/Formia-logo.svg" alt="Formia" className="h-9 w-auto" />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center space-y-6">

          {/* Icono */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#A855F7] flex items-center justify-center shadow-lg shadow-[#A855F7]/20">
              <ShieldCheck className="w-10 h-10 text-[#0C0C0C]" />
            </div>
          </div>

          {/* Título */}
          <div>
            <h1 className="text-3xl font-black text-[#0C0C0C] tracking-tight">
              Verificación de certificados
            </h1>
            <p className="text-[#666] mt-2 text-base leading-relaxed">
              Introduce el código que aparece en el certificado para comprobar
              su autenticidad e información.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="Ej: CM3K9X7P4Q2A"
                className="h-12 text-center font-mono text-base tracking-widest uppercase bg-white border-2 focus-visible:border-[#A855F7] focus-visible:ring-0"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                className="h-12 px-5 bg-[#A855F7] text-[#0C0C0C] hover:bg-[#A855F7]/90 font-bold gap-2 flex-shrink-0"
              >
                <Search className="w-4 h-4" />
                Verificar
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-500 text-left">{error}</p>
            )}
          </form>

          {/* Hint */}
          <p className="text-xs text-[#999] flex items-center justify-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            El código está en la esquina inferior del certificado PDF
          </p>
        </div>

        {/* Features */}
        <div className="mt-16 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Autenticidad garantizada",  desc: "Cada certificado tiene un código único e infalsificable generado por la plataforma." },
            { icon: Award,       title: "Información completa",      desc: "Muestra el nombre del empleado, el curso, la organización y la fecha de emisión." },
            { icon: Users,       title: "Verificación para RRHH",    desc: "Ideal para procesos de selección, auditorías o inspecciones laborales." },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-xl border border-[#eee] p-5 text-left">
              <f.icon className="w-5 h-5 text-[#A855F7] mb-3" />
              <p className="text-sm font-bold text-[#0C0C0C] mb-1">{f.title}</p>
              <p className="text-xs text-[#777] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#eee] text-center">
        <p className="text-xs text-[#999]">
          © {new Date().getFullYear()} Formia · Sistema de verificación de certificados
        </p>
      </footer>
    </div>
  );
}
