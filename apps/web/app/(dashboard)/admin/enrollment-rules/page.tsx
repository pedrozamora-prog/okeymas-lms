import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EnrollmentRulesClient } from "@/components/admin/enrollment-rules-client";

export const metadata = { title: "Reglas de inscripción automática" };

export default async function EnrollmentRulesPage() {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) redirect("/dashboard");

  const [rules, courses] = await Promise.all([
    prisma.enrollmentRule.findMany({
      where: { organizationId: user.organizationId },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      where: { organizationId: user.organizationId, status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return <EnrollmentRulesClient initialRules={rules as never} courses={courses} />;
}
