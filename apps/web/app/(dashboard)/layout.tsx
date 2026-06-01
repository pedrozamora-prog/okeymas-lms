import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { AiChatButton } from "@/components/ai/ai-chat-button";

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

  // White label: cargar config de la organización
  const org = user.organizationId ? await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: { primaryColor: true, customLogoUrl: true, name: true },
  }) : null;

  const primaryColor = org?.primaryColor ?? null;

  return (
    <div
      className="flex min-h-dvh bg-background"
      style={primaryColor ? { "--color-yelau-yellow": primaryColor } as React.CSSProperties : undefined}
    >
      <Sidebar
        userRole={user.role ?? "EMPLOYEE"}
        userName={user.name ?? "Usuario"}
        userEmail={user.email ?? ""}
        orgLogoUrl={org?.customLogoUrl ?? null}
        orgName={org?.name ?? "Okeymas"}
      />

      {/* Main content — offset on mobile para el top bar fijo */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <AiChatButton />
    </div>
  );
}
