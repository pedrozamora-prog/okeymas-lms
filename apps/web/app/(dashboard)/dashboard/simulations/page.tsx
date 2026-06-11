import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Play, Trophy, Target, BarChart3, CheckCircle, Star, History } from "lucide-react";
import { AttemptCard } from "@/components/simulations/attempt-card";
import { cn } from "@/lib/utils";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
const DIFFICULTY_LABEL: Record<Difficulty, string> = { EASY: "Fácil", MEDIUM: "Medio", HARD: "Difícil" };
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  EASY:   "bg-green-500/10  text-green-400  border-green-500/20",
  MEDIUM: "bg-amber-500/10  text-amber-500  border-amber-500/20",
  HARD:   "bg-red-500/10    text-red-400    border-red-500/20",
};

export default async function SimulationsPage() {
  const session = await auth();
  const user = session?.user as { id?: string; organizationId?: string } | undefined;
  if (!user?.id) redirect("/login");

  const [scenarios, allAttempts] = await Promise.all([
    (prisma as any).scenario.findMany({
      where:   { organizationId: user.organizationId, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    (prisma as any).simulationAttempt.findMany({
      where:   { userId: user.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  // Mejor puntuación por escenario
  const bestScore: Record<string, number> = {};
  for (const a of allAttempts) {
    if (!(a.scenarioId in bestScore) || a.score > bestScore[a.scenarioId]) {
      bestScore[a.scenarioId] = a.score;
    }
  }

  // Estadísticas globales
  const totalAttempts  = allAttempts.length;
  const avgScore       = totalAttempts > 0
    ? Math.round(allAttempts.reduce((s: number, a: { score: number }) => s + (a.score ?? 0), 0) / totalAttempts)
    : 0;
  const bestOverall    = totalAttempts > 0
    ? Math.max(...allAttempts.map((a: { score: number }) => a.score ?? 0))
    : 0;
  const scenariosPracticed = Object.keys(bestScore).length;

  // Mapa de escenarios para el historial
  const scenarioMap: Record<string, string> = {};
  for (const s of scenarios) scenarioMap[s.id] = s.title;

  // Últimos 10 intentos para el historial
  const recentAttempts = allAttempts.slice(0, 10);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Simulador de conversaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Practica situaciones reales con un cliente IA y recibe feedback detallado al terminar.
        </p>
      </div>

      {/* Stats globales (solo si hay intentos) */}
      {totalAttempts > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Intentos",              value: totalAttempts,       icon: BarChart3,    color: "text-primary",    bg: "bg-primary/10"    },
            { label: "Puntuación media",      value: `${avgScore}/100`,   icon: Star,         color: "text-amber-400",  bg: "bg-amber-400/10"  },
            { label: "Mejor puntuación",      value: `${bestOverall}/100`,icon: Trophy,       color: "text-green-400",  bg: "bg-green-400/10"  },
            { label: "Escenarios practicados",value: scenariosPracticed,  icon: CheckCircle,  color: "text-blue-400",   bg: "bg-blue-400/10"   },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover:border-border/80 transition-colors">
                <CardContent className="flex items-center gap-3 pt-4 pb-4">
                  <div className={`p-2 rounded-lg ${stat.bg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-foreground leading-none">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lista de escenarios */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Escenarios disponibles</h2>

        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 border border-dashed border-border rounded-2xl text-muted-foreground">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">Tu empresa no tiene escenarios de práctica todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scenarios.map((s: { id: string; title: string; description: string | null; difficulty: Difficulty; objective: string }) => {
              const best = bestScore[s.id];
              return (
                <div key={s.id} className="rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm">{s.title}</h3>
                        <Badge className={cn("text-[10px] border", DIFFICULTY_COLOR[s.difficulty as Difficulty])}>
                          {DIFFICULTY_LABEL[s.difficulty as Difficulty]}
                        </Badge>
                        {best !== undefined && (
                          <Badge className={cn("text-[10px] border gap-1",
                            best >= 80 ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : best >= 60 ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}>
                            <Trophy className="w-2.5 h-2.5" /> Mejor: {best}/100
                          </Badge>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-primary/60 flex-shrink-0" />
                        {s.objective}
                      </p>
                    </div>
                    <Button asChild size="sm" className="gap-1.5 flex-shrink-0">
                      <Link href={`/dashboard/simulations/${s.id}`}>
                        <Play className="w-3.5 h-3.5" />
                        {best !== undefined ? "Practicar de nuevo" : "Empezar"}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de intentos */}
      {recentAttempts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Mis últimas simulaciones
          </h2>
          <div className="space-y-2">
            {recentAttempts.map((a: {
              id: string;
              scenarioId: string;
              score: number;
              completedAt: string;
              feedback: string | null;
              evaluation: Record<string, unknown> | null;
            }) => (
              <AttemptCard
                key={a.id}
                scenarioTitle={scenarioMap[a.scenarioId] ?? "Escenario eliminado"}
                score={a.score ?? 0}
                completedAt={a.completedAt}
                feedback={a.feedback}
                evaluation={a.evaluation as {
                  tone?: string;
                  objectiveAchieved?: boolean;
                  summary?: string;
                  strengths?: string[];
                  improvements?: string[];
                } | null}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
