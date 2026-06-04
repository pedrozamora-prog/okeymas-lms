import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { plan, interval } = await req.json() as {
    plan:     "STARTER" | "PROFESSIONAL" | "CHAIN";
    interval: "monthly" | "annual";
  };

  const priceId = STRIPE_PRICES[plan]?.[interval];
  if (!priceId) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });

  const org = await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: { name: true, stripeCustomerId: true },
  });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode:                "subscription",
    payment_method_types: ["card"],
    customer:            org.stripeCustomerId ?? undefined,
    customer_creation:   org.stripeCustomerId ? undefined : "always",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/admin/billing?success=1`,
    cancel_url:  `${baseUrl}/admin/billing?canceled=1`,
    metadata: {
      organizationId: user.organizationId,
      plan,
    },
    subscription_data: {
      metadata: { organizationId: user.organizationId, plan },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
