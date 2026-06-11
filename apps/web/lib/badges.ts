import { prisma } from "@/lib/prisma";

type BadgeDef = {
  name:        string;
  description: string;
  points:      number;
  emoji:       string;
  check: (stats: { lessons: number; courses: number }) => boolean;
};

const BADGE_DEFS: BadgeDef[] = [
  { name: "Primera lección",        description: "Completa tu primera lección",        points: 0,   emoji: "🎯", check: s => s.lessons >= 1  },
  { name: "En racha",               description: "Completa 5 lecciones",               points: 50,  emoji: "🔥", check: s => s.lessons >= 5  },
  { name: "Estudiante dedicado",    description: "Completa 10 lecciones",              points: 100, emoji: "⚡", check: s => s.lessons >= 10 },
  { name: "Medio camino",           description: "Completa 25 lecciones",              points: 250, emoji: "💪", check: s => s.lessons >= 25 },
  { name: "Maestro del conocimiento",description: "Completa 50 lecciones",             points: 500, emoji: "🏅", check: s => s.lessons >= 50 },
  { name: "Primer curso",           description: "Completa tu primer curso",           points: 100, emoji: "🎓", check: s => s.courses >= 1  },
  { name: "Coleccionista",          description: "Completa 3 cursos",                  points: 300, emoji: "📚", check: s => s.courses >= 3  },
  { name: "Veterano",               description: "Completa 5 cursos",                  points: 500, emoji: "🏆", check: s => s.courses >= 5  },
];

export type EarnedBadge = { name: string; description: string; emoji: string; points: number };

export async function checkAndAwardBadges(userId: string): Promise<EarnedBadge[]> {
  // Estadísticas del alumno
  const [lessonCount, courseCount] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId, completed: true } }),
    prisma.enrollment.count({ where: { userId, status: "COMPLETED" } }),
  ]);
  const stats = { lessons: lessonCount, courses: courseCount };

  // Badges ya ganados
  const existing = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: { select: { name: true } } },
  });
  const existingNames = new Set(existing.map(ub => ub.badge.name));

  const newlyEarned: EarnedBadge[] = [];

  for (const def of BADGE_DEFS) {
    if (existingNames.has(def.name)) continue;
    if (!def.check(stats)) continue;

    // Find-or-create badge definition
    let badge = await prisma.badge.findFirst({ where: { name: def.name } });
    if (!badge) {
      badge = await prisma.badge.create({
        data: { name: def.name, description: def.description, points: def.points },
      });
    }

    // Otorgar al usuario
    await prisma.userBadge.createMany({
      data:           [{ userId, badgeId: badge.id }],
      skipDuplicates: true,
    });

    // Sumar puntos XP si tiene recompensa
    if (def.points > 0) {
      await prisma.userPoints.upsert({
        where:  { userId },
        create: { userId, total: def.points },
        update: { total: { increment: def.points } },
      });
    }

    newlyEarned.push({ name: def.name, description: def.description, emoji: def.emoji, points: def.points });
  }

  return newlyEarned;
}
