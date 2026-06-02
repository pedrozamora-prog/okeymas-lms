import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { OrgManagerClient } from "@/components/superadmin/org-manager-client";

export const metadata = { title: "Gestionar organización" };

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, courses: true } },
      webhooks: true,
    },
  });

  if (!org) notFound();

  return <OrgManagerClient org={org as never} />;
}
