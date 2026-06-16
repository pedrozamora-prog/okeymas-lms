import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// GET — load WhatsApp config for the org
export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const rows = await prisma.$queryRaw<{
      whatsappEnabled: boolean;
      whatsappProvider: string | null;
      whatsappApiKey: string | null;
      whatsappApiUrl: string | null;
      whatsappFromPhone: string | null;
    }[]>`
      SELECT
        "whatsappEnabled",
        "whatsappProvider",
        "whatsappApiKey",
        "whatsappApiUrl",
        "whatsappFromPhone"
      FROM organizations
      WHERE id = ${user.organizationId}
      LIMIT 1
    `;
    const row = rows[0] ?? {};

    return NextResponse.json({
      whatsappEnabled:   row.whatsappEnabled ?? false,
      whatsappProvider:  row.whatsappProvider ?? null,
      // Mask the key — only expose last 4 chars
      whatsappApiKey:    row.whatsappApiKey ? `${"•".repeat(20)}${row.whatsappApiKey.slice(-4)}` : null,
      whatsappApiKeySet: !!row.whatsappApiKey,
      whatsappApiUrl:    row.whatsappApiUrl ?? null,
      whatsappFromPhone: row.whatsappFromPhone ?? null,
    });
  } catch {
    // Columns may not exist yet (migration pending)
    return NextResponse.json({
      whatsappEnabled: false, whatsappProvider: null,
      whatsappApiKey: null, whatsappApiKeySet: false,
      whatsappApiUrl: null, whatsappFromPhone: null,
    });
  }
}

// PATCH — save WhatsApp config
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as {
    whatsappEnabled?: boolean;
    whatsappProvider?: string | null;
    whatsappApiKey?: string | null;
    whatsappApiUrl?: string | null;
    whatsappFromPhone?: string | null;
  };

  try {
    // Build dynamic SET clause — only update provided fields
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;

    if (body.whatsappEnabled !== undefined) {
      sets.push(`"whatsappEnabled" = $${i++}`);
      vals.push(body.whatsappEnabled);
    }
    if ("whatsappProvider" in body) {
      sets.push(`"whatsappProvider" = $${i++}`);
      vals.push(body.whatsappProvider ?? null);
    }
    if ("whatsappApiKey" in body && body.whatsappApiKey && !body.whatsappApiKey.startsWith("••")) {
      // Only save if it's a real key (not the masked placeholder)
      sets.push(`"whatsappApiKey" = $${i++}`);
      vals.push(body.whatsappApiKey);
    }
    if ("whatsappApiUrl" in body) {
      sets.push(`"whatsappApiUrl" = $${i++}`);
      vals.push(body.whatsappApiUrl ?? null);
    }
    if ("whatsappFromPhone" in body) {
      sets.push(`"whatsappFromPhone" = $${i++}`);
      vals.push(body.whatsappFromPhone ?? null);
    }

    if (sets.length === 0) return NextResponse.json({ ok: true });

    vals.push(user.organizationId);
    const query = `UPDATE organizations SET ${sets.join(", ")} WHERE id = $${i}`;
    await prisma.$executeRawUnsafe(query, ...vals);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp config save error:", err);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

// POST — test: send a test WhatsApp message to the requesting user's phone
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as { action?: string };
  if (body.action !== "test") return NextResponse.json({ error: "Acción inválida" }, { status: 400 });

  // Get user's WhatsApp phone
  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, whatsappPhone: true } as { name: true; whatsappPhone: true },
  }) as { name: string; whatsappPhone?: string | null } | null;

  const phone = userRow?.whatsappPhone;
  if (!phone) {
    return NextResponse.json({
      error: "No tienes un número de WhatsApp configurado en tu perfil. Ve a Perfil → Editar para añadirlo.",
    }, { status: 400 });
  }

  // Get org config
  const rows = await prisma.$queryRaw<{
    whatsappEnabled: boolean;
    whatsappProvider: string | null;
    whatsappApiKey: string | null;
    whatsappApiUrl: string | null;
    whatsappFromPhone: string | null;
  }[]>`
    SELECT "whatsappEnabled", "whatsappProvider", "whatsappApiKey", "whatsappApiUrl", "whatsappFromPhone"
    FROM organizations WHERE id = ${user.organizationId} LIMIT 1
  `;
  const cfg = rows[0];

  if (!cfg?.whatsappProvider || !cfg?.whatsappApiKey) {
    return NextResponse.json({ error: "Configura el proveedor y la API key primero" }, { status: 400 });
  }

  const result = await sendWhatsAppMessage(
    {
      provider: cfg.whatsappProvider as "atendia" | "wati" | "ycloud",
      apiKey: cfg.whatsappApiKey,
      apiUrl: cfg.whatsappApiUrl ?? undefined,
      fromPhone: cfg.whatsappFromPhone ?? undefined,
    },
    phone,
    `✅ Mensaje de prueba de Formia. WhatsApp configurado correctamente con ${cfg.whatsappProvider.toUpperCase()}.`,
    { externalId: `formia_test_${user.id}_${Date.now()}` }
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, messageId: result.messageId });
}
