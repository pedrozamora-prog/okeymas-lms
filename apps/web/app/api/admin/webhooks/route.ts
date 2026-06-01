import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webhooks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { url, events, secret, organizationId } = await req.json();
  if (!url || !events?.length) {
    return NextResponse.json({ error: "url y events son obligatorios" }, { status: 400 });
  }

  const orgId = user.role === "SUPER_ADMIN" && organizationId
    ? organizationId
    : user.organizationId;

  const webhook = await prisma.webhook.create({
    data: { url, events, secret: secret || null, organizationId: orgId },
  });

  return NextResponse.json(webhook, { status: 201 });
}
