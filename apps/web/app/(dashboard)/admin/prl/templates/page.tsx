import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HardHat, FileCheck2 } from "lucide-react";
import { PRL_TEMPLATES } from "@/lib/prl-templates";
import { TemplateCard } from "./template-card";

export const metadata = { title: "Plantillas PRL — Formia" };

const RISK_CONFIG = {
  BASICO:     { label: "Nivel Básico",     color: "bg-blue-100 text-blue-700 border-blue-200",   dot: "bg-blue-500" },
  ESPECIFICO: { label: "Nivel Específico", color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  DIRECTIVO:  { label: "Nivel Directivo",  color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
};

const DEPT_LABELS: Record<string, string> = {
  ADMINISTRACION: "Administración",
  RECEPCION: "Recepción",
  LIMPIEZA: "Limpieza",
  MONITOR: "Monitor",
  DEPORTIVO: "Deportivo",
};

export default async function PrlTemplatesPage() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/prl"
          className="mt-1 h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary" />
            Plantillas PRL oficiales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cursos estructurados según la Ley 31/1995 y el Convenio de Instalaciones Deportivas.
            Copia la plantilla, añade tu contenido y publica.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
        <FileCheck2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground">¿Cómo funciona?</p>
          <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
            Al copiar una plantilla se crea un curso en estado <strong>Borrador</strong> con la estructura
            legal correcta: módulos, lecciones y preguntas de evaluación reales basadas en la normativa española.
            Solo tienes que añadir tus vídeos o PDFs corporativos y pulsar <strong>Publicar</strong>.
            En menos de 10 minutos tienes la formación PRL lista para asignar a tu equipo.
          </p>
        </div>
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PRL_TEMPLATES.map((template) => {
          const riskCfg = RISK_CONFIG[template.prlRiskLevel];
          const totalQuestions = template.modules.reduce(
            (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.quiz?.questions.length ?? 0), 0),
            0,
          );
          const totalLessons = template.modules.reduce((acc, m) => acc + m.lessons.length, 0);
          const deptLabels = template.targetDepartments.map(d => DEPT_LABELS[d] ?? d);

          return (
            <TemplateCard
              key={template.id}
              template={template}
              riskLabel={riskCfg.label}
              riskColor={riskCfg.color}
              totalQuestions={totalQuestions}
              totalLessons={totalLessons}
              deptLabels={deptLabels}
            />
          );
        })}
      </div>
    </div>
  );
}
