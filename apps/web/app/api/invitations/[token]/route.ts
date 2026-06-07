import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { applyEnrollmentRules } from "@/lib/auto-enroll";

// GET — verificar que el token es válido (para pre-rellenar el form)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true, customLogoUrl: true, logoUrl: true } } },
  });

  if (!invitation)                           return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  if (invitation.acceptedAt)                 return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 410 });
  if (new Date() > invitation.expiresAt)     return NextResponse.json({ error: "Esta invitación ha caducado" }, { status: 410 });

  return NextResponse.json({
    email:    invitation.email,
    role:     invitation.role,
    orgName:  invitation.organization.name,
    orgLogo:  invitation.organization.customLogoUrl ?? invitation.organization.logoUrl ?? null,
  });
}

// POST — aceptar invitación y crear cuenta
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { name, password } = await req.json();

  if (!name?.trim() || !password || password.length < 8) {
    return NextResponse.json({ error: "Nombre y contraseña (mín. 8 caracteres) son obligatorios" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, maxUsers: true, _count: { select: { users: true } } } } },
  });

  if (!invitation)                           return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  if (invitation.acceptedAt)                 return NextResponse.json({ error: "Esta invitación ya fue utilizada" }, { status: 410 });
  if (new Date() > invitation.expiresAt)     return NextResponse.json({ error: "Esta invitación ha caducado" }, { status: 410 });

  // Verificar límite del plan
  const org = invitation.organization;
  if (org._count.users >= org.maxUsers) {
    return NextResponse.json({ error: "La organización ha alcanzado el límite de usuarios de su plan" }, { status: 403 });
  }

  // ¿Ya existe un usuario con ese email?
  const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existing) return NextResponse.json({ error: "Este email ya tiene una cuenta" }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      name:           name.trim(),
      email:          invitation.email,
      hashedPassword,
      role:           invitation.role,
      departmentId:   invitation.departmentId ?? null,
      organizationId: invitation.organizationId,
    },
  });

  // Marcar invitación como aceptada
  await prisma.invitation.update({
    where: { token },
    data:  { acceptedAt: new Date() },
  });

  // Auto-inscribir según reglas
  await applyEnrollmentRules(newUser.id, newUser.organizationId, newUser.role, newUser.departmentId);

  return NextResponse.json({ ok: true });
}
