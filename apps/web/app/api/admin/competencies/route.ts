import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getAdmin(session: Awaited<ReturnType<typeof auth>>) {
  const u = session?.user as { id?: string; role?: string; organizationId?: string } | undefined;
  return ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(u?.role ?? "") ? u! : null;
}

export async function GET() {
  const session = await auth();
  const user = getAdmin(session);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const competencies = await prisma.competency.findMany({
    where:   { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ competencies });
}

export async function POST(req: Request) {
  const session = await auth();
  const user = getAdmin(session);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const competency = await prisma.competency.create({
    data: { name: name.trim(), description: description ?? null, organizationId: user.organizationId! },
  });
  return NextResponse.json({ competency }, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!getAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, name, description } = await req.json();
  const competency = await prisma.competency.update({ where: { id }, data: { name, description } });
  return NextResponse.json({ competency });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!getAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.competency.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
