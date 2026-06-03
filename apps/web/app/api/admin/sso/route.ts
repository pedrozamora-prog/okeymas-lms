import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireFeature } from "@/lib/plan-gate";

export async function GET(_req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const gate = await requireFeature(user.organizationId, "sso");
  if (gate) return gate;

  const config = await prisma.orgSsoConfig.findUnique({ where: { organizationId: user.organizationId } });
  return NextResponse.json(config ?? null);
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const gate = await requireFeature(user.organizationId, "sso");
  if (gate) return gate;

  const { isEnabled, idpEntityId, idpSsoUrl, idpCertificate } = await req.json();

  const config = await prisma.orgSsoConfig.upsert({
    where:  { organizationId: user.organizationId },
    update: { isEnabled: isEnabled ?? false, idpEntityId: idpEntityId ?? "", idpSsoUrl: idpSsoUrl ?? "", idpCertificate: idpCertificate ?? "" },
    create: { organizationId: user.organizationId, isEnabled: isEnabled ?? false, idpEntityId: idpEntityId ?? "", idpSsoUrl: idpSsoUrl ?? "", idpCertificate: idpCertificate ?? "" },
  });

  return NextResponse.json(config);
}
