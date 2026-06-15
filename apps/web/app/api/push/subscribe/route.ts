import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET — devuelve la clave pública VAPID para el cliente
export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return NextResponse.json({ error: "Push no configurado" }, { status: 503 });
  }
  return NextResponse.json({ vapidPublicKey });
}

// POST — guarda una suscripción push
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { endpoint, keys } = await req.json() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  await prisma.$executeRaw`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (${user.id}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
    ON CONFLICT (user_id, endpoint) DO UPDATE
      SET p256dh = ${keys.p256dh}, auth = ${keys.auth}
  `;

  return NextResponse.json({ ok: true });
}

// DELETE — elimina la suscripción push
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { endpoint } = await req.json() as { endpoint: string };

  await prisma.$executeRaw`
    DELETE FROM push_subscriptions
    WHERE user_id = ${user.id} AND endpoint = ${endpoint}
  `;

  return NextResponse.json({ ok: true });
}
