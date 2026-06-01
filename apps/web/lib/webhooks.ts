import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

type WebhookEventType = "COURSE_COMPLETED" | "CERTIFICATE_ISSUED" | "USER_CREATED" | "ENROLLMENT_CREATED";

export async function dispatchWebhook(
  organizationId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      organizationId,
      isActive: true,
      events:   { has: event },
    },
  });

  if (webhooks.length === 0) return;

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  await Promise.allSettled(
    webhooks.map(async wh => {
      const headers: Record<string, string> = {
        "Content-Type":    "application/json",
        "X-Okeymas-Event": event,
      };

      if (wh.secret) {
        const sig = createHmac("sha256", wh.secret).update(body).digest("hex");
        headers["X-Okeymas-Signature"] = `sha256=${sig}`;
      }

      await fetch(wh.url, { method: "POST", headers, body });
    })
  );
}
