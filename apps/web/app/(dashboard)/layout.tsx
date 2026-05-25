import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
    name?: string | null;
    email?: string | null;
    role?: string;
  };

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        userRole={user.role ?? "EMPLOYEE"}
        userName={user.name ?? "Usuario"}
        userEmail={user.email ?? ""}
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
