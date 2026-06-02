import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_LOCALES = ["es", "en", "fr", "it", "pt"];

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!VALID_LOCALES.includes(body.locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale: body.locale },
  });

  return NextResponse.json({ ok: true });
}
