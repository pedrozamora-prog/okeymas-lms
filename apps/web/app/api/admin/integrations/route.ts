import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// GET — obtener config actual de la organización
export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: { apiKey: true, hrisProvider: true, hrisSyncEnabled: true },
  });

  const logs = await prisma.hrisSyncLog.findMany({
    where:   { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    take:    50,
    select:  { id: true, event: true, email: true, status: true, message: true, createdAt: true },
  });

  return NextResponse.json({ org, logs });
}

// PATCH — actualizar config HRIS o generar nueva API key
export async function PATCH(req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { action, hrisProvider, hrisSyncEnabled } = await req.json();

  if (action === "regenerate-key") {
    const apiKey = `fmk_${randomBytes(24).toString("hex")}`;
    const org = await prisma.organization.update({
      where:  { id: user.organizationId },
      data:   { apiKey },
      select: { apiKey: true },
    });
    return NextResponse.json({ apiKey: org.apiKey });
  }

  const data: Record<string, unknown> = {};
  if (hrisProvider !== undefined)    data.hrisProvider = hrisProvider || null;
  if (hrisSyncEnabled !== undefined) data.hrisSyncEnabled = Boolean(hrisSyncEnabled);

  await prisma.organization.update({
    where: { id: user.organizationId },
    data,
  });

  return NextResponse.json({ ok: true });
}
