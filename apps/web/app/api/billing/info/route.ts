import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: {
      plan:                 true,
      stripeStatus:         true,
      stripeSubscriptionId: true,
      stripePriceId:        true,
      planExpiresAt:        true,
    },
  });

  return NextResponse.json(org ?? { plan: "STARTER", stripeStatus: null, stripeSubscriptionId: null });
}
