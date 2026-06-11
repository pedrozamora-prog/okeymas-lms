import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id: string; role?: string; organizationId?: string } | undefined;
  if (!user?.id) return NextResponse.json({ results: [] });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const isAdmin = ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role ?? "");

  const [courses, lessons, users] = await Promise.all([
    // Cursos publicados de la org
    prisma.course.findMany({
      where: {
        organizationId: user.organizationId!,
        status: "PUBLISHED",
        title:  { contains: q, mode: "insensitive" },
      },
      select: { id: true, title: true, thumbnailUrl: true },
      take: 5,
    }),

    // Lecciones en cursos de la org
    prisma.lesson.findMany({
      where: {
        title:  { contains: q, mode: "insensitive" },
        module: { course: { organizationId: user.organizationId!, status: "PUBLISHED" } },
      },
      select: {
        id:     true,
        title:  true,
        type:   true,
        module: { select: { courseId: true, course: { select: { title: true } } } },
      },
      take: 5,
    }),

    // Usuarios (solo admins)
    isAdmin
      ? prisma.user.findMany({
          where: {
            organizationId: user.organizationId!,
            isActive:       true,
            OR: [
              { name:  { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true, role: true },
          take: 4,
        })
      : Promise.resolve([]),
  ]);

  const results = [
    ...courses.map(c => ({
      type:  "course" as const,
      id:    c.id,
      title: c.title,
      sub:   "Curso",
      href:  `/dashboard/courses/${c.id}`,
    })),
    ...lessons.map(l => ({
      type:  "lesson" as const,
      id:    l.id,
      title: l.title,
      sub:   l.module.course.title,
      href:  `/dashboard/courses/${l.module.courseId}/lessons/${l.id}`,
    })),
    ...users.map((u: { id: string; name: string | null; email: string; role: string }) => ({
      type:  "user" as const,
      id:    u.id,
      title: u.name ?? u.email,
      sub:   u.email,
      href:  `/admin/users/${u.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
