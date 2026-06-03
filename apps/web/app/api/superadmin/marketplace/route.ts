import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";

// PATCH — toggle isMarketplace and update marketplace metadata for a course
export async function PATCH(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { courseId, isMarketplace, marketplaceCategory, marketplaceShortDesc } = body as {
    courseId: string;
    isMarketplace: boolean;
    marketplaceCategory?: string;
    marketplaceShortDesc?: string;
  };

  if (!courseId || typeof isMarketplace !== "boolean") {
    return NextResponse.json({ error: "courseId y isMarketplace son requeridos" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: {
      isMarketplace,
      marketplaceCategory:  isMarketplace ? (marketplaceCategory  ?? course.marketplaceCategory)  : null,
      marketplaceShortDesc: isMarketplace ? (marketplaceShortDesc ?? course.marketplaceShortDesc) : null,
    },
  });

  await createAuditLog({
    action:         "COURSE_UPDATED",
    userId:         user.id,
    organizationId: user.organizationId,
    entity:         "Course",
    entityId:       courseId,
    metadata:       { isMarketplace, marketplaceCategory, marketplaceShortDesc },
  });

  return NextResponse.json({ ok: true, courseId: updated.id, isMarketplace: updated.isMarketplace });
}

// GET — list all courses across all orgs for marketplace management
export async function GET() {
  const session = await auth();
  const user = session?.user as { role: string } | undefined;
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      organization: { select: { name: true, slug: true } },
      modules: { include: { lessons: { select: { id: true } } } },
    },
    orderBy: [{ isMarketplace: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(courses.map(c => ({
    id:                   c.id,
    title:                c.title,
    description:          c.description,
    thumbnailUrl:         c.thumbnailUrl,
    isMarketplace:        c.isMarketplace,
    marketplaceCategory:  c.marketplaceCategory,
    marketplaceShortDesc: c.marketplaceShortDesc,
    status:               c.status,
    org:                  c.organization?.name ?? "—",
    orgSlug:              c.organization?.slug ?? "—",
    moduleCount:          c.modules.length,
    lessonCount:          c.modules.flatMap(m => m.lessons).length,
  })));
}
