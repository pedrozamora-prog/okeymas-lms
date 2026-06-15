import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendPushToMany } from "@/lib/push";

// POST /api/admin/inactivity/remind
// body: { userIds: string[], message?: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  const admin = session?.user as { id: string; role?: string; organizationId?: string } | undefined;
  if (!admin?.id || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(admin.role ?? "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { userIds, message } = await req.json() as { userIds: string[]; message?: string };
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Debes indicar al menos un usuario" }, { status: 400 });
  }

  // Verificar que todos los usuarios pertenecen a la misma org
  const validUsers = await prisma.user.findMany({
    where: { id: { in: userIds }, organizationId: admin.organizationId!, isActive: true },
    select: { id: true },
  });
  const validIds = validUsers.map(u => u.id);
  if (validIds.length === 0) {
    return NextResponse.json({ error: "No se encontraron usuarios válidos" }, { status: 400 });
  }

  const notifMessage = message?.trim() || "Llevas varios días sin estudiar. ¡Vuelve a tu formación y sigue avanzando!";

  await prisma.notification.createMany({
    data: validIds.map(userId => ({
      userId,
      type:    "INACTIVITY_REMINDER" as any,
      title:   "¡Te echamos de menos! 👋",
      message: notifMessage,
    })),
    skipDuplicates: false,
  });

  // Push (fire & forget)
  sendPushToMany(validIds, {
    title: "¡Te echamos de menos! 👋",
    body:  notifMessage,
    url:   "/dashboard",
    tag:   "inactivity-reminder",
  });

  return NextResponse.json({ ok: true, sent: validIds.length });
}
