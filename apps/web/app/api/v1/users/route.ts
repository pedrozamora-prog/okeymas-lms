export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getOrgFromApiKey } from "@/lib/api-auth";
import { applyEnrollmentRules } from "@/lib/auto-enroll";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// GET /api/v1/users — lista de empleados
export async function GET(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: "API key inválida" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dept = searchParams.get("department");
  const role = searchParams.get("role");

  // dept param can be a department ID or name
  let departmentId: string | undefined;
  if (dept) {
    const deptRecord = await prisma.department.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ id: dept }, { name: { equals: dept, mode: "insensitive" } }],
      },
      select: { id: true },
    });
    departmentId = deptRecord?.id;
  }

  const users = await prisma.user.findMany({
    where: {
      organizationId: org.id,
      isActive: true,
      ...(departmentId ? { departmentId } : {}),
      ...(role && { role: role as Role }),
    },
    select: {
      id: true, name: true, email: true, role: true,
      department: { select: { name: true } },
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: users.map(u => ({ ...u, department: u.department?.name ?? null })),
    total: users.length,
  });
}

// POST /api/v1/users — crear empleado (sincronización RRHH)
export async function POST(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: "API key inválida" }, { status: 401 });

  const count = await prisma.user.count({ where: { organizationId: org.id } });
  if (count >= org.maxUsers) {
    return NextResponse.json({
      error: `Límite de usuarios alcanzado (${org.maxUsers} en plan ${org.plan})`
    }, { status: 403 });
  }

  const { name, email, department, role, phone, password } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "name y email son obligatorios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });

  // Resolve department by ID or name
  let departmentId: string | null = null;
  if (department) {
    const deptRecord = await prisma.department.findFirst({
      where: {
        organizationId: org.id,
        OR: [{ id: department }, { name: { equals: department, mode: "insensitive" } }],
      },
      select: { id: true },
    });
    departmentId = deptRecord?.id ?? null;
  }

  const hashedPassword = password
    ? await bcrypt.hash(password, 12)
    : await bcrypt.hash(Math.random().toString(36), 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      hashedPassword,
      departmentId,
      role: (role as Role) || "EMPLOYEE",
      organizationId: org.id,
    },
    select: {
      id: true, name: true, email: true, role: true,
      department: { select: { name: true } },
      createdAt: true,
    },
  });

  await applyEnrollmentRules(user.id, org.id, user.role as Role, user.departmentId);

  return NextResponse.json({
    data: { ...user, department: user.department?.name ?? null },
  }, { status: 201 });
}
