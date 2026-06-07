import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { buyerEmail, buyerName } = (await req.json()) as {
    buyerEmail?: string;
    buyerName?: string;
  };

  if (!buyerEmail) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where:  { id, isPublic: true, status: "PUBLISHED" },
    select: {
      id:           true,
      title:        true,
      thumbnailUrl: true,
      price:        true,
      currency:     true,
      organizationId: true,
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
  }

  if (!course.price || course.price <= 0) {
    return NextResponse.json({ error: "Este curso no tiene precio configurado" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode:                "payment",
    payment_method_types: ["card"],
    customer_email:      buyerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency:     course.currency ?? "eur",
          unit_amount:  course.price,
          product_data: {
            name:        course.title,
            description: `Acceso completo al curso "${course.title}"`,
            images:      course.thumbnailUrl ? [course.thumbnailUrl] : [],
          },
        },
      },
    ],
    success_url: `${baseUrl}/cursos/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${baseUrl}/cursos/${id}`,
    metadata: {
      type:           "course_purchase",
      courseId:       course.id,
      organizationId: course.organizationId,
      buyerEmail,
      buyerName:      buyerName ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}
