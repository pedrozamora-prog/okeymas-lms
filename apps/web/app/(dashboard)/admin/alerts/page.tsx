import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertsClient } from "./alerts-client";

export const metadata = { title: "Alertas de riesgo" };

export default async function AlertsPage() {
  const session = await auth();
  const user    = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  // Pre-fetch para SSR rápido — el cliente puede refrescar
  const org = await prisma.organization.findUnique({
    where:  { id: user.organizationId },
    select: { emailFromName: true, emailFromAddress: true, emailReplyTo: true, resendApiKey: true },
  });

  return <AlertsClient orgId={user.organizationId} />;
}
