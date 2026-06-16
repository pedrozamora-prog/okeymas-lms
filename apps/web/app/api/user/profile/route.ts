import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/user/profile — update own name, phone, whatsappPhone
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string } | undefined;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    phone?: string | null;
    whatsappPhone?: string | null;
  };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name        !== undefined ? { name: body.name.trim() || undefined }   : {}),
      ...(body.phone       !== undefined ? { phone: body.phone?.trim() || null }     : {}),
      ...(body.whatsappPhone !== undefined ? { whatsappPhone: body.whatsappPhone?.trim() || null } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
