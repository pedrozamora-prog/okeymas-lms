import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TeamClient } from "./team-client";

export const metadata = { title: "Mi equipo" };


export default async function ManagerTeamPage() {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || user.role !== "MANAGER") redirect("/dashboard");

  const manager = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { departmentId: true, name: true, department: { select: { name: true } } },
  });

  const now = new Date();

  const teamMembers = await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
      isActive:       true,
      role:           "EMPLOYEE",
      ...(manager?.departmentId ? { departmentId: manager.departmentId } : {}),
    },
    include: {
      department: { select: { name: true } },
      enrollments: {
        include: { course: { select: { id: true, title: true, isRequired: true } } },
        orderBy:  { enrolledAt: "desc" },
      },
      certificates: { select: { id: true } },
      points:       { select: { total: true } },
    },
    orderBy: { name: "asc" },
  });

  const members = teamMembers.map(m => {
    const total     = m.enrollments.length;
    const completed = m.enrollments.filter(e => e.status === "COMPLETED").length;
    const overdue   = m.enrollments.filter(e => e.status === "EXPIRED").length;
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    const pendingWithDeadline = m.enrollments
      .filter(e => e.status !== "COMPLETED" && e.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    const nextDeadline = pendingWithDeadline[0]?.deadline ?? null;
    const daysToNext   = nextDeadline
      ? Math.ceil((new Date(nextDeadline).getTime() - now.getTime()) / 86400000)
      : null;

    const isAtRisk  = daysToNext !== null && daysToNext >= 0 && daysToNext <= 3;
    const isOverdue = overdue > 0;
    const isOnTrack = !isOverdue && !isAtRisk && (total === 0 || completed === total);

    const requiredPending = m.enrollments.filter(
      e => e.course.isRequired && e.status !== "COMPLETED"
    ).length;

    const pendingCourses = m.enrollments
      .filter(e => e.status !== "COMPLETED")
      .map(e => ({
        courseId:   e.courseId,
        title:      e.course.title,
        isRequired: e.course.isRequired,
        status:     e.status,
        deadline:   e.deadline?.toISOString() ?? null,
        daysLeft:   e.deadline
          ? Math.ceil((new Date(e.deadline).getTime() - now.getTime()) / 86400000)
          : null,
      }));

    return {
      id:             m.id,
      name:           m.name,
      email:          m.email,
      department:     m.department?.name ?? null,
      total, completed, overdue, pct,
      certs:          m.certificates.length,
      points:         m.points?.total ?? 0,
      isAtRisk, isOverdue, isOnTrack,
      requiredPending,
      nextDeadline:   nextDeadline?.toISOString() ?? null,
      daysToNext,
      pendingCourses,
    };
  });

  const stats = {
    total:         members.length,
    onTrack:       members.filter(m => m.isOnTrack).length,
    atRisk:        members.filter(m => m.isAtRisk && !m.isOverdue).length,
    overdue:       members.filter(m => m.isOverdue).length,
    compliancePct: members.length > 0
      ? Math.round(members.reduce((s, m) => s + m.pct, 0) / members.length)
      : 0,
  };

  return (
    <TeamClient
      members={members}
      stats={stats}
      deptLabel={manager?.department?.name ?? "Todos los departamentos"}
    />
  );
}
