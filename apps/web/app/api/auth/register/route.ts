import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Department } from "@prisma/client";
import { applyEnrollmentRules } from "@/lib/auto-enroll";

export async function POST(req: Request) {
  const { name, email, phone, password, department } = await req.json();

  if (!name || !email || !password || !department) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
  }

  const org = await prisma.organization.findFirst();
  if (!org) {
    return NextResponse.json({ error: "No hay ninguna organización configurada" }, { status: 500 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      hashedPassword,
      department: department as Department,
      organizationId: org.id,
    },
  });

  // Auto-inscribir según reglas activas
  await applyEnrollmentRules(user.id, org.id, user.role, user.department);

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
