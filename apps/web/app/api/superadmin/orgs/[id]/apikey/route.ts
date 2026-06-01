import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const apiKey = `ok_live_${randomBytes(24).toString("hex")}`;

  await prisma.organization.update({
    where: { id },
    data: { apiKey },
  });

  return NextResponse.json({ apiKey });
}
