import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LiveClassesClient } from "./live-client";

export const metadata = { title: "Clases en Directo — Admin" };

export default async function AdminLivePage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string };

  if (!["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    redirect("/dashboard");
  }

  const [classes, instructors] = await Promise.all([
    prisma.liveClass.findMany({
      where: { organizationId: user.organizationId },
      include: {
        instructor: { select: { id: true, name: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
        role: { in: ["INSTRUCTOR", "SUPER_ADMIN", "BRANCH_ADMIN"] },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <LiveClassesClient
      initialClasses={JSON.parse(JSON.stringify(classes))}
      instructors={instructors}
      currentUserId={user.id}
    />
  );
}
