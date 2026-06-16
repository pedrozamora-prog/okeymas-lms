// Multi-provider WhatsApp abstraction
// Supported: AtendIA | Wati | YCloud
// Config is read from the Organization's whatsapp* columns (added via SQL migration)

export type WhatsAppProvider = "atendia" | "wati" | "ycloud";

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  apiKey: string;
  apiUrl?: string;       // Wati: https://live-server-XXXXX.wati.io
  fromPhone?: string;    // Wati/YCloud: sender phone or phone_number_id
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  to: string,
  message: string,
  opts?: {
    externalId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<WhatsAppResult> {
  try {
    if (config.provider === "atendia") {
      return await sendViaAtendIA(config.apiKey, to, message, opts?.externalId, opts?.metadata);
    }
    if (config.provider === "wati") {
      if (!config.apiUrl) return { success: false, error: "Wati requiere la URL del servidor (apiUrl)" };
      return await sendViaWati(config.apiKey, config.apiUrl, to, message);
    }
    if (config.provider === "ycloud") {
      if (!config.fromPhone) return { success: false, error: "YCloud requiere el Phone Number ID (fromPhone)" };
      return await sendViaYCloud(config.apiKey, config.fromPhone, to, message);
    }
    return { success: false, error: "Proveedor no soportado" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

// ── AtendIA ───────────────────────────────────────────────────────────────────

async function sendViaAtendIA(
  apiKey: string,
  to: string,
  message: string,
  externalId?: string,
  metadata?: Record<string, unknown>
): Promise<WhatsAppResult> {
  // external_id must be unique per message — reuse the same id on retry for idempotency
  const extId = externalId ?? `formia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await fetch(
    "https://ycxuofmyydrwjltnkezc.supabase.co/functions/v1/send-whatsapp-api-message",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to,
        message,
        external_id: extId,
        metadata: { source: "formia", ...metadata },
      }),
    }
  );

  const data = await res.json() as {
    provider: string;
    success: boolean;
    message_id?: string;
    status?: string;
    error?: string;
    error_code?: string;
  };

  if (!data.success) {
    return { success: false, error: data.error ?? data.error_code ?? "Error en AtendIA" };
  }
  return { success: true, messageId: data.message_id, status: data.status };
}

// ── Wati ──────────────────────────────────────────────────────────────────────

async function sendViaWati(
  apiKey: string,
  apiUrl: string,
  to: string,
  message: string
): Promise<WhatsAppResult> {
  // Wati expects the number without + for the path, but + in the body is also accepted
  const phoneForPath = to.replace(/^\+/, "").replace(/\s/g, "");
  const base = apiUrl.replace(/\/$/, "");

  const res = await fetch(`${base}/api/v1/sendSessionMessage/${phoneForPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messageText: message }),
  });

  const data = await res.json() as { result?: boolean; id?: string; error?: string };

  if (!res.ok || data.result === false) {
    return { success: false, error: data.error ?? `HTTP ${res.status}` };
  }
  return { success: true, messageId: data.id };
}

// ── YCloud ────────────────────────────────────────────────────────────────────

async function sendViaYCloud(
  apiKey: string,
  fromPhoneNumberId: string,
  to: string,
  message: string
): Promise<WhatsAppResult> {
  const res = await fetch("https://api.ycloud.com/v2/whatsapp/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      from: fromPhoneNumberId,
      to,
      type: "text",
      text: { body: message },
    }),
  });

  const data = await res.json() as { id?: string; status?: string; errorMessage?: string };

  if (!res.ok) {
    return { success: false, error: data.errorMessage ?? `HTTP ${res.status}` };
  }
  return { success: true, messageId: data.id, status: data.status };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Load WhatsApp config for an org from the DB (raw SQL — columns not in Prisma client)
export async function getOrgWhatsAppConfig(prisma: {
  $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
}, organizationId: string): Promise<(WhatsAppConfig & { enabled: boolean }) | null> {
  try {
    const rows = await (prisma.$queryRaw as (
      strings: TemplateStringsArray,
      ...values: unknown[]
    ) => Promise<{
      whatsappEnabled: boolean;
      whatsappProvider: string | null;
      whatsappApiKey: string | null;
      whatsappApiUrl: string | null;
      whatsappFromPhone: string | null;
    }[]>)`
      SELECT
        "whatsappEnabled",
        "whatsappProvider",
        "whatsappApiKey",
        "whatsappApiUrl",
        "whatsappFromPhone"
      FROM organizations
      WHERE id = ${organizationId}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row || !row.whatsappProvider || !row.whatsappApiKey) return null;
    return {
      enabled: row.whatsappEnabled,
      provider: row.whatsappProvider as WhatsAppProvider,
      apiKey: row.whatsappApiKey,
      apiUrl: row.whatsappApiUrl ?? undefined,
      fromPhone: row.whatsappFromPhone ?? undefined,
    };
  } catch {
    return null;
  }
}
