import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/inactivity?days=14
export async function GET(req: NextRequest) {
  const session = await auth();
  const admin = session?.user as { id: string; role?: string; organizationId?: string } | undefined;
  if (!admin?.id || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(admin.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const days    = Math.max(1, parseInt(req.nextUrl.searchParams.get("days") ?? "14", 10));
  const cutoff  = new Date(Date.now() - days * 86_400_000);

  // Todos los usuarios activos de la org
  const orgUsers = await prisma.user.findMany({
    where: {
      organizationId: admin.organizationId!,
      isActive:       true,
      role:           "EMPLOYEE",
    },
    select: {
      id:         true,
      name:       true,
      email:      true,
      department: { select: { name: true } },
    },
  });

  if (orgUsers.length === 0) return NextResponse.json({ users: [] });

  // Última actividad (updatedAt de LessonProgress) por usuario
  const activity = await prisma.lessonProgress.groupBy({
    by:      ["userId"],
    where:   { userId: { in: orgUsers.map(u => u.id) } },
    _max:    { updatedAt: true },
  });

  const lastActivityMap = new Map(
    activity.map(a => [a.userId, a._max.updatedAt])
  );

  const now = Date.now();
  const inactiveUsers = orgUsers
    .map(u => {
      const last      = lastActivityMap.get(u.id) ?? null;
      const daysSince = last
        ? Math.floor((now - new Date(last).getTime()) / 86_400_000)
        : 9999;
      return {
        id:           u.id,
        name:         u.name,
        email:        u.email,
        department:   u.department?.name ?? null,
        lastActivity: last ? last.toISOString() : null,
        daysSince,
      };
    })
    .filter(u => u.daysSince >= days)
    .sort((a, b) => b.daysSince - a.daysSince);

  return NextResponse.json({ users: inactiveUsers });
}
