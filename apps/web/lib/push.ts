import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? "admin@formia.app"}`,
  process.env.VAPID_PUBLIC_KEY  ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

interface PushPayload {
  title:   string;
  body:    string;
  url?:    string;
  icon?:   string;
  tag?:    string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await prisma.$queryRaw<{ endpoint: string; p256dh: string; auth: string }[]>`
    SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}
  `;

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, icon: payload.icon ?? "/logo-icon.png" }),
      )
    )
  );

  // Eliminar suscripciones expiradas (410 Gone)
  const expired = subs.filter((_, i) => {
    const r = results[i];
    return r.status === "rejected" && (r.reason as { statusCode?: number })?.statusCode === 410;
  });
  for (const sub of expired) {
    await prisma.$executeRaw`
      DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}
    `;
  }
}

export async function sendPushToMany(userIds: string[], payload: PushPayload) {
  await Promise.allSettled(userIds.map(id => sendPushToUser(id, payload)));
}
