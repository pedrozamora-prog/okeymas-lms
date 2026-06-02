"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Locale = "es" | "en" | "fr" | "it" | "pt";

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "es", label: "Español",    flag: "🇪🇸" },
  { value: "en", label: "English",    flag: "🇬🇧" },
  { value: "fr", label: "Français",   flag: "🇫🇷" },
  { value: "it", label: "Italiano",   flag: "🇮🇹" },
  { value: "pt", label: "Português",  flag: "🇵🇹" },
];

type Messages = Record<string, unknown>;

// ─── Context ──────────────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface I18nProviderProps {
  initialLocale: Locale;
  initialMessages: Record<Locale, Messages>;
  children: React.ReactNode;
}

export function I18nProvider({ initialLocale, initialMessages, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [allMessages] = useState(initialMessages);
  const router = useRouter();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const messages = allMessages[locale] ?? allMessages["es"];
      const parts = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = messages;
      for (const part of parts) {
        value = value?.[part];
      }
      if (typeof value !== "string") return key;
      if (!params) return value;
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    },
    [locale, allMessages]
  );

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      await fetch("/api/user/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
      // Re-render all Server Components on the page with the new locale
      router.refresh();
    } catch {
      // silent — UI already updated
    }
  }, [router]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
