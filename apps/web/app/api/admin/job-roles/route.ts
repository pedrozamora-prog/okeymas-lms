import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AdminUser = { role?: string; organizationId?: string };

function getAdmin(s: unknown): AdminUser | null {
  const u = (s as { user?: AdminUser } | null)?.user;
  return ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(u?.role ?? "") ? u! : null;
}

export async function GET() {
  const session = await auth();
  const user = getAdmin(session);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const roles = await prisma.jobRole.findMany({
    where:   { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  const session = await auth();
  const user = getAdmin(session);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const role = await prisma.jobRole.create({
    data: { name: name.trim(), description: description ?? null, organizationId: user.organizationId! },
  });
  return NextResponse.json({ role }, { status: 201 });
}
