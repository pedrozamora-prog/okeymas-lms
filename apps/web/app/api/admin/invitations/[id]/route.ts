import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.invitation.deleteMany({
    where: { id, organizationId: user.organizationId },
  });

  return NextResponse.json({ ok: true });
}
