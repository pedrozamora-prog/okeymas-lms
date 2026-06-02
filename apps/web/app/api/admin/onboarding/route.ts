import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendInvitationEmail } from "@/lib/email";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; name?: string; role: string; organizationId: string; email?: string } | undefined;

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { orgName, logoUrl, emailFromName, emailFromAddress, emailReplyTo, resendApiKey, inviteEmails } = body;

  // 1. Actualizar datos de la organización
  const orgData: Record<string, unknown> = { onboardedAt: new Date() };
  if (orgName?.trim())        orgData.name             = orgName.trim();
  if (logoUrl !== undefined)  orgData.logoUrl          = logoUrl?.trim() || null;
  if (emailFromName !== undefined)    orgData.emailFromName    = emailFromName?.trim()    || null;
  if (emailFromAddress !== undefined) orgData.emailFromAddress = emailFromAddress?.trim() || null;
  if (emailReplyTo !== undefined)     orgData.emailReplyTo     = emailReplyTo?.trim()     || null;
  if (resendApiKey !== undefined)     orgData.resendApiKey     = resendApiKey?.trim()     || null;

  const org = await prisma.organization.update({
    where: { id: user.organizationId },
    data:  orgData,
  });

  // 2. Enviar invitaciones si hay emails
  const emails: string[] = (inviteEmails ?? [])
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.includes("@"));

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const results: { email: string; status: string }[] = [];

  for (const email of emails) {
    const existingUser = await prisma.user.findFirst({
      where: { email, organizationId: user.organizationId },
    });
    if (existingUser) { results.push({ email, status: "exists" }); continue; }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await prisma.invitation.upsert({
      where:  { email_organizationId: { email, organizationId: user.organizationId } },
      update: { role: "EMPLOYEE" as Role, invitedById: user.id, expiresAt, acceptedAt: null },
      create: { email, role: "EMPLOYEE" as Role, organizationId: user.organizationId, invitedById: user.id, expiresAt },
    });

    await sendInvitationEmail(
      email,
      `${appUrl}/invite/${invitation.token}`,
      org.name,
      user.name ?? "El administrador",
      "Empleado",
      { fromName: org.emailFromName, fromAddress: org.emailFromAddress, replyTo: org.emailReplyTo, resendApiKey: org.resendApiKey },
    );

    results.push({ email, status: "sent" });
  }

  return NextResponse.json({ ok: true, invitations: results });
}
