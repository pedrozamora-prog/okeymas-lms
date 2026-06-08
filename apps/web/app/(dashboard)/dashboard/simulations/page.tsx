import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Play, Trophy, Target, ChevronRight } from "lucide-react";
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

  const scenarios = await (prisma as any).scenario.findMany({
    where:   { organizationId: user.organizationId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  // Best attempt per scenario for this user
  const attempts = await (prisma as any).simulationAttempt.findMany({
    where:   { userId: user.id, completedAt: { not: null } },
    orderBy: { score: "desc" },
    select:  { scenarioId: true, score: true },
  });

  const bestScore: Record<string, number> = {};
  for (const a of attempts) {
    if (!(a.scenarioId in bestScore) || a.score > bestScore[a.scenarioId]) {
      bestScore[a.scenarioId] = a.score;
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Simulador de conversaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Practica situaciones reales con un cliente IA antes de enfrentarlas en persona. Recibirás feedback detallado al terminar.
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border rounded-2xl text-muted-foreground">
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
  );
}
