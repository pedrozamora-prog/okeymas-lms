import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.$executeRaw`
    UPDATE users SET onboarded_at = NOW() WHERE id = ${user.id}
  `;

  return NextResponse.json({ ok: true });
}
