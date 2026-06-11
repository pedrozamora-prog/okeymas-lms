import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Posición → color / icono
const RANK_CONFIG: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; ring: string }> = {
  1: { icon: Crown,  color: "text-yellow-400",  bg: "bg-yellow-400/10",  ring: "ring-yellow-400/40"  },
  2: { icon: Medal,  color: "text-slate-300",   bg: "bg-slate-300/10",   ring: "ring-slate-300/40"   },
  3: { icon: Award,  color: "text-orange-400",  bg: "bg-orange-400/10",  ring: "ring-orange-400/40"  },
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default async function LeaderboardPage() {
  const session = await auth();
  const user = session?.user as { id: string; organizationId?: string } | undefined;
  if (!user?.id) redirect("/login");

  // Top 50 de la organización por puntos XP
  const topUsers = await prisma.userPoints.findMany({
    where:   { user: { organizationId: user.organizationId!, isActive: true } },
    orderBy: { total: "desc" },
    take:    50,
    include: {
      user: {
        select: {
          id:           true,
          name:         true,
          image:        true,
          department:   { select: { name: true } },
        },
      },
    },
  });

  // Posición del usuario actual (si no está en top 50)
  const myRankIndex = topUsers.findIndex(u => u.userId === user.id);
  let myEntry: typeof topUsers[0] | null = null;
  let myRank = myRankIndex + 1;

  if (myRankIndex === -1) {
    // Calcular posición real
    const myPoints = await prisma.userPoints.findUnique({ where: { userId: user.id } });
    if (myPoints) {
      const above = await prisma.userPoints.count({
        where: { total: { gt: myPoints.total }, user: { organizationId: user.organizationId! } },
      });
      myRank   = above + 1;
      myEntry  = { ...myPoints, user: { id: user.id, name: session?.user?.name ?? "Tú", image: null, department: null } } as typeof topUsers[0];
    }
  }

  const totalParticipants = await prisma.userPoints.count({
    where: { user: { organizationId: user.organizationId!, isActive: true } },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Clasificación
        </h1>
        <p className="text-sm text-muted-foreground">
          Ranking de tu organización por puntos XP · {totalParticipants} participantes
        </p>
      </div>

      {/* Mi posición (destacada si no está en top 50) */}
      {myRank > 0 && (
        <Card className={cn(
          "border-primary/30 bg-primary/5",
          myRankIndex !== -1 && "hidden"
        )}>
          <CardContent className="flex items-center gap-4 pt-4 pb-4">
            <span className="text-xl font-black text-primary w-8 text-center">#{myRank}</span>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ring-2 ring-primary/40">
              <span className="text-yelau-black font-bold text-sm">
                {getInitials(myEntry?.user.name ?? session?.user?.name ?? "?")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Tú</p>
              <p className="text-xs text-muted-foreground">Fuera del top 50</p>
            </div>
            <span className="text-sm font-black text-primary">
              {myEntry?.total ?? 0} XP
            </span>
          </CardContent>
        </Card>
      )}

      {/* Podio top 3 */}
      {topUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {/* 2º puesto */}
          <PodiumCard entry={topUsers[1]} rank={2} isMe={topUsers[1]?.userId === user.id} />
          {/* 1º puesto */}
          <PodiumCard entry={topUsers[0]} rank={1} isMe={topUsers[0]?.userId === user.id} />
          {/* 3º puesto */}
          <PodiumCard entry={topUsers[2]} rank={3} isMe={topUsers[2]?.userId === user.id} />
        </div>
      )}

      {/* Lista completa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Clasificación completa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nadie ha acumulado puntos todavía. ¡Sé el primero completando una lección!
            </p>
          ) : (
            <div className="divide-y divide-border">
              {topUsers.map((entry, i) => {
                const rank    = i + 1;
                const isMe    = entry.userId === user.id;
                const cfg     = RANK_CONFIG[rank];
                const initials = getInitials(entry.user.name ?? "?");

                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 transition-colors",
                      isMe ? "bg-primary/5" : "hover:bg-muted/30"
                    )}
                  >
                    {/* Posición */}
                    <div className={cn("w-8 text-center flex-shrink-0", cfg ? cfg.color : "text-muted-foreground")}>
                      {cfg ? (
                        <cfg.icon className={cn("w-5 h-5 mx-auto", cfg.color)} />
                      ) : (
                        <span className="text-sm font-bold">{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                      isMe ? "bg-primary ring-2 ring-primary/40" : "bg-muted",
                      cfg && !isMe && `ring-2 ${cfg.ring}`
                    )}>
                      {entry.user.image ? (
                        <img src={entry.user.image} alt={entry.user.name ?? ""} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className={cn("text-xs font-bold", isMe ? "text-yelau-black" : "text-foreground")}>
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Nombre + departamento */}
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isMe && "text-primary")}>
                        {entry.user.name}{isMe && " (tú)"}
                      </p>
                      {entry.user.department?.name && (
                        <p className="text-[11px] text-muted-foreground truncate">{entry.user.department.name}</p>
                      )}
                    </div>

                    {/* XP */}
                    <div className="flex-shrink-0 text-right">
                      <p className={cn("text-sm font-black", cfg ? cfg.color : isMe ? "text-primary" : "text-foreground")}>
                        {entry.total.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ── Podio ──────────────────────────────────────────────────────────────────────
function PodiumCard({
  entry,
  rank,
  isMe,
}: {
  entry: { userId: string; total: number; user: { name: string | null; image: string | null; department: { name: string } | null } };
  rank: number;
  isMe: boolean;
}) {
  const cfg      = RANK_CONFIG[rank];
  const initials = getInitials(entry.user.name ?? "?");
  const heights  = { 1: "pt-2", 2: "pt-6", 3: "pt-8" };

  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", heights[rank as 1 | 2 | 3])}>
      {/* Icono de posición */}
      <cfg.icon className={cn("w-5 h-5", cfg.color)} />

      {/* Avatar */}
      <div className={cn(
        "rounded-full flex items-center justify-center ring-2",
        isMe ? "bg-primary ring-primary/60" : `${cfg.bg} ring-2 ${cfg.ring}`,
        rank === 1 ? "w-14 h-14" : "w-11 h-11"
      )}>
        {entry.user.image ? (
          <img src={entry.user.image} alt={entry.user.name ?? ""} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className={cn("font-black", isMe ? "text-yelau-black" : cfg.color, rank === 1 ? "text-lg" : "text-sm")}>
            {initials}
          </span>
        )}
      </div>

      {/* Nombre */}
      <p className="text-xs font-semibold text-foreground leading-tight truncate w-full px-1">
        {entry.user.name}{isMe ? " (tú)" : ""}
      </p>

      {/* XP */}
      <Badge className={cn("text-[10px] border", cfg.bg, cfg.color, `border-${cfg.color.replace("text-", "")}/20`)}>
        {entry.total.toLocaleString()} XP
      </Badge>
    </div>
  );
}
