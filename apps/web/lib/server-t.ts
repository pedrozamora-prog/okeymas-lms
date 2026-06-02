import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Locale } from "./i18n-context";
import messagesEs from "@/messages/es.json";
import messagesEn from "@/messages/en.json";
import messagesFr from "@/messages/fr.json";
import messagesIt from "@/messages/it.json";
import messagesPt from "@/messages/pt.json";

const allMessages: Record<Locale, Record<string, unknown>> = {
  es: messagesEs as Record<string, unknown>,
  en: messagesEn as Record<string, unknown>,
  fr: messagesFr as Record<string, unknown>,
  it: messagesIt as Record<string, unknown>,
  pt: messagesPt as Record<string, unknown>,
};

export async function getServerT() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  let locale: Locale = "es";
  if (userId) {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { locale: true },
    });
    locale = (user?.locale ?? "es") as Locale;
  }
  const messages = allMessages[locale] ?? allMessages.es;

  return function t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split(".");
    let value: unknown = messages;
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part];
    }
    if (typeof value !== "string") return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  };
}
