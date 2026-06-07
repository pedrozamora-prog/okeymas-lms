import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { users: true } } },
  });

  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  try {
    const dept = await prisma.department.create({
      data: { name: name.trim(), organizationId: user.organizationId },
      select: { id: true, name: true, _count: { select: { users: true } } },
    });
    return NextResponse.json(dept, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe un departamento con ese nombre" }, { status: 409 });
  }
}
