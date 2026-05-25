import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  if (id !== user.organizationId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name, logoUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const org = await prisma.organization.update({
    where: { id },
    data: {
      name: name.trim(),
      logoUrl: logoUrl?.trim() || null,
    },
  });

  return NextResponse.json(org);
}
