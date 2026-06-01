import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function checkSuperAdmin() {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  return user?.role === "SUPER_ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkSuperAdmin()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { plan, maxUsers, isActive, planExpiresAt } = await req.json();

  const org = await prisma.organization.update({
    where: { id },
    data: {
      ...(plan !== undefined && { plan }),
      ...(maxUsers !== undefined && { maxUsers }),
      ...(isActive !== undefined && { isActive }),
      planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null,
    },
  });

  return NextResponse.json(org);
}
