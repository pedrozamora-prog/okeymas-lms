export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getOrgFromApiKey } from "@/lib/api-auth";

// PATCH /api/v1/users/:id — update employee (name, email, department, role, active)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: "API key inválida" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, department, isActive, role } = body;

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  let departmentId: string | undefined;
  if (department !== undefined) {
    if (department === null) {
      departmentId = undefined; // will set to null below
    } else {
      const deptRecord = await prisma.department.findFirst({
        where: {
          organizationId: org.id,
          OR: [{ id: department }, { name: { equals: department, mode: "insensitive" } }],
        },
        select: { id: true },
      });
      departmentId = deptRecord?.id;
    }
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined)     data.name = name.trim();
  if (email !== undefined)    data.email = email.trim().toLowerCase();
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (role !== undefined)     data.role = role;
  if (department !== undefined) data.departmentId = department === null ? null : (departmentId ?? null);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      department: { select: { name: true } },
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: { ...user, department: user.department?.name ?? null } });
}

// DELETE /api/v1/users/:id — deactivate employee (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: "API key inválida" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, message: "Empleado desactivado" });
}
