import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { AiChatButton } from "@/components/ai/ai-chat-button";
import { I18nProvider, type Locale } from "@/lib/i18n-context";
import { TutorProvider } from "@/lib/tutor-context";
import { OfflineIndicator } from "@/components/layout/offline-indicator";
import messagesEs from "@/messages/es.json";
import messagesEn from "@/messages/en.json";
import messagesFr from "@/messages/fr.json";
import messagesIt from "@/messages/it.json";
import messagesPt from "@/messages/pt.json";

const ALL_MESSAGES = { es: messagesEs, en: messagesEn, fr: messagesFr, it: messagesIt, pt: messagesPt };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    organizationId?: string;
  };

  // White label + onboarding check
  const org = user.organizationId ? await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: { primaryColor: true, customLogoUrl: true, name: true, onboardedAt: true },
  }) : null;

  // Redirigir al wizard si el SUPER_ADMIN no ha completado el onboarding
  if (user.role === "SUPER_ADMIN" && org && !org.onboardedAt) {
    redirect("/onboarding");
  }

  const primaryColor = org?.primaryColor ?? null;

  const dbUser = user.id ? await prisma.user.findUnique({
    where:  { id: user.id },
    select: { locale: true },
  }) : null;
  const locale = (dbUser?.locale ?? "es") as Locale;

  return (
    <I18nProvider initialLocale={locale} initialMessages={ALL_MESSAGES}>
    <TutorProvider>
    <div
      className="flex min-h-dvh bg-background"
      style={primaryColor ? { "--color-yelau-yellow": primaryColor } as React.CSSProperties : undefined}
    >
      <Sidebar
        userRole={user.role ?? "EMPLOYEE"}
        userName={user.name ?? "Usuario"}
        userEmail={user.email ?? ""}
        orgLogoUrl={org?.customLogoUrl ?? null}
        orgName={org?.name ?? "Formia"}
      />

      {/* Main content — offset on mobile para el top bar fijo */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <AiChatButton />
      <OfflineIndicator />
    </div>
    </TutorProvider>
    </I18nProvider>
  );
}
