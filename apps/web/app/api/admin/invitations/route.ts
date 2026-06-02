import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendInvitationEmail } from "@/lib/email";
import { Role, Department } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:  "Super Admin",
  BRANCH_ADMIN: "Administrador",
  MANAGER:      "Mánager",
  INSTRUCTOR:   "Instructor",
  EMPLOYEE:     "Empleado",
};

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; name?: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();

  // Soporte para importación con roles/depts mixtos por fila
  type ItemInput = { email: string; role?: string; department?: string };
  const items: ItemInput[] = Array.isArray(body.items)
    ? body.items.map((i: ItemInput) => ({
        email:      i.email?.trim().toLowerCase() ?? "",
        role:       i.role       ?? body.role       ?? "EMPLOYEE",
        department: i.department ?? body.department ?? undefined,
      })).filter((i: ItemInput) => i.email)
    : (Array.isArray(body.emails)
        ? body.emails.map((e: string) => ({
            email:      e.trim().toLowerCase(),
            role:       body.role       ?? "EMPLOYEE",
            department: body.department ?? undefined,
          }))
        : [{ email: body.email?.trim().toLowerCase(), role: body.role ?? "EMPLOYEE", department: body.department ?? undefined }]
      ).filter((i: ItemInput) => i.email);

  if (items.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos un email" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      name: true,
      emailFromName: true, emailFromAddress: true,
      emailReplyTo: true, resendApiKey: true,
    },
  });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  const results: { email: string; status: "sent" | "exists" | "already_invited" }[] = [];
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  for (const item of items) {
    const { email } = item;
    const itemRole  = item.role as Role ?? "EMPLOYEE";
    const itemDept  = item.department as Department | undefined;

    // ¿Ya es usuario de esta org?
    const existingUser = await prisma.user.findFirst({
      where: { email, organizationId: user.organizationId },
    });
    if (existingUser) {
      results.push({ email, status: "exists" });
      continue;
    }

    // Upsert invitación
    const invitation = await prisma.invitation.upsert({
      where:  { email_organizationId: { email, organizationId: user.organizationId } },
      update: { role: itemRole, department: itemDept ?? null, invitedById: user.id, expiresAt, acceptedAt: null },
      create: { email, role: itemRole, department: itemDept ?? null, organizationId: user.organizationId, invitedById: user.id, expiresAt },
    });

    const inviteUrl = `${appUrl}/invite/${invitation.token}`;

    await sendInvitationEmail(
      email,
      inviteUrl,
      org.name,
      user.name ?? "El administrador",
      ROLE_LABELS[itemRole] ?? itemRole,
      { fromName: org.emailFromName, fromAddress: org.emailFromAddress, replyTo: org.emailReplyTo, resendApiKey: org.resendApiKey },
    );

    results.push({ email, status: "sent" });
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where:   { organizationId: user.organizationId, acceptedAt: null },
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}
