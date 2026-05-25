import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Logros" };

export default async function AchievementsPage() {
  const session = await auth();
  const user = session?.user as { id: string };

  const [userPoints, userBadges, allBadges, completedCourses, totalEnrolled] = await Promise.all([
    prisma.userPoints.findUnique({ where: { userId: user.id } }),
    prisma.userBadge.findMany({ where: { userId: user.id }, include: { badge: true } }),
    prisma.badge.findMany(),
    prisma.enrollment.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.enrollment.count({ where: { userId: user.id } }),
  ]);

  const earnedIds = new Set(userBadges.map((ub: { badgeId: string }) => ub.badgeId));
  const totalPoints = userPoints?.total ?? 0;

  // Nivel del usuario basado en puntos
  const levels = [
    { name: "Principiante", min: 0,   max: 100,  color: "text-gray-400"   },
    { name: "Activo",       min: 100, max: 300,  color: "text-blue-400"   },
    { name: "Avanzado",     min: 300, max: 600,  color: "text-purple-400" },
    { name: "Experto",      min: 600, max: 1000, color: "text-yelau-yellow"},
    { name: "Élite",        min: 1000, max: Infinity, color: "text-orange-400" },
  ];
  const currentLevel = levels.findLast(l => totalPoints >= l.min) ?? levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel
    ? Math.round(((totalPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Logros y Puntos</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu progreso y recompensas en Okeymas LMS</p>
      </div>

      {/* Stats top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Puntos totales",  value: totalPoints,           icon: Star,   color: "text-yelau-yellow" },
          { label: "Nivel actual",    value: currentLevel.name,      icon: Zap,    color: currentLevel.color  },
          { label: "Cursos completados", value: completedCourses,   icon: Target, color: "text-green-400"    },
          { label: "Badges obtenidos",   value: `${earnedIds.size}/${allBadges.length}`, icon: Trophy, color: "text-purple-400" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-2">
                <Icon className={cn("w-6 h-6", stat.color)} />
                <p className="text-xl font-black text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Barra de nivel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className={cn("font-black text-base", currentLevel.color)}>{currentLevel.name}</span>
            {nextLevel && <span className="text-xs text-muted-foreground font-normal">{nextLevel.min - totalPoints} pts para {nextLevel.name}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={levelProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentLevel.min} pts</span>
            <span className="font-semibold text-foreground">{totalPoints} pts</span>
            {nextLevel && <span>{nextLevel.min} pts</span>}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Insignias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allBadges.map((badge: { id: string; name: string; imageUrl: string | null; description: string | null; points: number }) => {
            const earned = earnedIds.has(badge.id);
            const earnedDate = userBadges.find((ub: { badgeId: string; earnedAt: Date }) => ub.badgeId === badge.id)?.earnedAt;
            return (
              <Card key={badge.id} className={cn(
                "text-center transition-colors",
                earned ? "border-yelau-yellow/40 bg-yelau-yellow/5" : "opacity-50 grayscale"
              )}>
                <CardContent className="pt-5 pb-5 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
                    earned ? "bg-yelau-yellow/20" : "bg-muted"
                  )}>
                    {badge.imageUrl ?? "🏅"}
                  </div>
                  <p className="text-xs font-semibold text-foreground">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{badge.description}</p>
                  <Badge variant={earned ? "default" : "outline"} className="text-[10px]">
                    {earned ? `+${badge.points} pts` : `${badge.points} pts`}
                  </Badge>
                  {earned && earnedDate && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(earnedDate).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
