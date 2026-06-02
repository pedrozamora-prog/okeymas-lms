import { auth } from "@/auth";
import { sendTestEmail, OrgEmailConfig } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string; email?: string } | undefined;

  const { id } = await params;
  if (!user || user.role !== "SUPER_ADMIN" || id !== user.organizationId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const cfg: OrgEmailConfig = {
    fromName:    body.emailFromName    || null,
    fromAddress: body.emailFromAddress || null,
    replyTo:     body.emailReplyTo     || null,
    resendApiKey: body.resendApiKey    || null,
  };

  const to = body.to || user.email;
  if (!to) return NextResponse.json({ error: "No hay email de destino" }, { status: 400 });

  try {
    await sendTestEmail(to, cfg);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al enviar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
