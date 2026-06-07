import { stripe, PRICE_ID_TO_PLAN } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendCoursePurchaseWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

      // B2C — course purchase
      if (session.metadata?.type === "course_purchase") {
        await handleCoursePurchase(session);
        break;
      }

      // B2B — org subscription
      const orgId = session.metadata?.organizationId;
      const plan  = session.metadata?.plan;
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
      const invoice    = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (!customerId) break;

      const org = await prisma.organization.findUnique({
        where:  { stripeCustomerId: customerId },
        select: { id: true },
      });
      if (!org) break;

      await prisma.organization.update({
        where: { id: org.id },
        data:  { stripeStatus: "past_due" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCoursePurchase(session: Stripe.Checkout.Session) {
  const { courseId, organizationId, buyerEmail, buyerName } = session.metadata ?? {};
  if (!courseId || !organizationId || !buyerEmail) return;

  const amountPaid = session.amount_total ?? 0;
  const currency   = session.currency ?? "eur";

  // Idempotency — if already processed, skip
  const existing = await prisma.coursePurchase.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing?.status === "COMPLETED") return;

  const course = await prisma.course.findUnique({
    where:  { id: courseId },
    select: { title: true },
  });
  if (!course) return;

  const org = await prisma.organization.findUnique({
    where:  { id: organizationId },
    select: { name: true },
  });

  // Find or create the buyer's user account
  let user = await prisma.user.findFirst({
    where: { email: buyerEmail, organizationId },
    select: { id: true, name: true },
  });

  let tempPassword: string | null = null;

  if (!user) {
    tempPassword = crypto.randomBytes(6).toString("hex"); // e.g. "a3f8c2d9"
    const hashed = await bcrypt.hash(tempPassword, 12);
    const newUser = await prisma.user.create({
      data: {
        email:          buyerEmail,
        name:           buyerName || buyerEmail.split("@")[0],
        hashedPassword: hashed,
        role:           "EMPLOYEE",
        organizationId,
        isActive:       true,
      },
    });
    user = { id: newUser.id, name: newUser.name };
  }

  // Create enrollment (upsert for idempotency)
  await prisma.enrollment.upsert({
    where:  { userId_courseId: { userId: user.id, courseId } },
    create: {
      userId:       user.id,
      courseId,
      status:       "ENROLLED",
      autoEnrolled: false,
    },
    update: {},
  });

  // Record the purchase
  await prisma.coursePurchase.upsert({
    where:  { stripeSessionId: session.id },
    create: {
      courseId,
      organizationId,
      buyerEmail,
      buyerName:      buyerName || null,
      userId:         user.id,
      stripeSessionId: session.id,
      amountPaid,
      currency,
      status:         "COMPLETED",
    },
    update: {
      status: "COMPLETED",
      userId: user.id,
    },
  });

  // Send welcome email (fire & forget)
  const baseUrl  = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const loginUrl = `${baseUrl}/login`;

  sendCoursePurchaseWelcomeEmail(
    buyerEmail,
    buyerName ?? "",
    course.title,
    loginUrl,
    tempPassword,
    org?.name ?? "Formia",
  ).catch(() => {});
}
