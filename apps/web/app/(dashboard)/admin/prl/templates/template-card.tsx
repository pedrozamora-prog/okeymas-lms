"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, BookOpen, CheckCircle2, Loader2, Copy, Users, AlertCircle } from "lucide-react";
import type { PrlTemplate } from "@/lib/prl-templates";

interface Props {
  template: PrlTemplate;
  riskLabel: string;
  riskColor: string;
  totalQuestions: number;
  totalLessons: number;
  deptLabels: string[];
}

export function TemplateCard({ template, riskLabel, riskColor, totalQuestions, totalLessons, deptLabels }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "exists" | "error">("idle");
  const router = useRouter();

  async function handleCopy() {
    setState("loading");
    try {
      const res = await fetch(`/api/admin/prl/templates/${template.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setState("error"); return; }
      if (data.alreadyExists) {
        setState("exists");
        setTimeout(() => router.push(`/admin/courses/${data.courseId}/edit`), 600);
      } else {
        setState("done");
        setTimeout(() => router.push(`/admin/courses/${data.courseId}/edit`), 800);
      }
    } catch {
      setState("error");
    }
  }

  const btnLabel = {
    idle:    <><Copy className="w-4 h-4" /> Usar esta plantilla</>,
    loading: <><Loader2 className="w-4 h-4 animate-spin" /> Creando curso...</>,
    done:    <><CheckCircle2 className="w-4 h-4" /> ¡Listo! Abriendo editor…</>,
    exists:  <><CheckCircle2 className="w-4 h-4" /> Ya existe — abriendo editor…</>,
    error:   <><AlertCircle className="w-4 h-4" /> Error — inténtalo de nuevo</>,
  }[state];

  return (
    <div className="bg-card rounded-2xl border border-border flex flex-col overflow-hidden hover:border-primary/40 transition-colors">

      {/* Body */}
      <div className="p-6 flex flex-col gap-4 flex-1">

        {/* Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${riskColor}`}>
            {riskLabel}
          </span>
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Válido {template.certificateValidityDays / 365} años
          </span>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="font-bold text-foreground leading-snug">{template.title}</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
            {template.description}
          </p>
        </div>

        {/* Legal basis */}
        <p className="text-[11px] text-primary font-semibold">{template.legalBasis}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {template.estimatedHours}h estimadas
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            {totalLessons} lecciones
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            {totalQuestions} preguntas reales
          </span>
        </div>

        {/* Modules list */}
        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Módulos incluidos</p>
          {template.modules.map((mod, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{mod.title}</span>
            </div>
          ))}
        </div>

        {/* Target */}
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Users className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{deptLabels.join(", ")}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleCopy}
          disabled={state === "loading" || state === "done" || state === "exists"}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${state === "error"
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            }`}
        >
          {btnLabel}
        </button>
        {state === "exists" && (
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            Ya tenías este curso creado — te llevamos a editarlo.
          </p>
        )}
      </div>
    </div>
  );
}
