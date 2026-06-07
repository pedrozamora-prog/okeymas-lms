import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { applyEnrollmentRules } from "@/lib/auto-enroll";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const { name, email, phone, password, departmentId } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
  }

  const org = await prisma.organization.findFirst({
    include: { _count: { select: { users: true } } },
  });
  if (!org) {
    return NextResponse.json({ error: "No hay ninguna organización configurada" }, { status: 500 });
  }

  if (org._count.users >= org.maxUsers) {
    return NextResponse.json({
      error: `Límite de usuarios alcanzado (${org.maxUsers} en plan ${org.plan}). Contacta con soporte para ampliar tu plan.`
    }, { status: 403 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name:           name.trim(),
      email:          email.trim().toLowerCase(),
      phone:          phone?.trim() || null,
      hashedPassword,
      departmentId:   departmentId || null,
      organizationId: org.id,
    },
  });

  await applyEnrollmentRules(user.id, org.id, user.role, user.departmentId);

  await createAuditLog({
    action: "USER_CREATED",
    userId: user.id,
    organizationId: org.id,
    entity: "User",
    entityId: user.id,
    metadata: { name: user.name, email: user.email, role: user.role },
  });

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
