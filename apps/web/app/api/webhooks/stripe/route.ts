import { stripe, PRICE_ID_TO_PLAN } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId   = session.metadata?.organizationId;
      const plan    = session.metadata?.plan;
      if (!orgId || !plan) break;

      await prisma.organization.update({
        where: { id: orgId },
        data:  {
          plan:                plan as "STARTER" | "PROFESSIONAL" | "CHAIN",
          stripeCustomerId:    session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripeStatus:        "active",
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub   = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;

      const priceId = sub.items.data[0]?.price.id;
      const plan    = priceId ? PRICE_ID_TO_PLAN[priceId] : undefined;

      await prisma.organization.update({
        where: { id: orgId },
        data:  {
          stripeStatus: sub.status,
          stripePriceId: priceId ?? undefined,
          ...(plan ? { plan: plan as "STARTER" | "PROFESSIONAL" | "CHAIN" | "ENTERPRISE" } : {}),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub   = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;

      await prisma.organization.update({
        where: { id: orgId },
        data:  {
          plan:                "STARTER",
          stripeSubscriptionId: null,
          stripePriceId:       null,
          stripeStatus:        "canceled",
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const sub     = invoice.subscription
        ? await stripe.subscriptions.retrieve(invoice.subscription as string)
        : null;
      const orgId   = sub?.metadata?.organizationId;
      if (!orgId) break;

      await prisma.organization.update({
        where: { id: orgId },
        data:  { stripeStatus: "past_due" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
