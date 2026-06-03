import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — browse marketplace catalog
export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { role: string; organizationId: string } | undefined;
  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const courses = await prisma.course.findMany({
    where: {
      isMarketplace: true,
      status:        "PUBLISHED",
      ...(category ? { marketplaceCategory: category } : {}),
    },
    include: {
      modules: {
        include: { lessons: { select: { id: true, type: true } } },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check which ones are already imported by this org
  const imported = await prisma.course.findMany({
    where: { organizationId: user.organizationId, importedFromId: { not: null } },
    select: { importedFromId: true },
  });
  const importedIds = new Set(imported.map(c => c.importedFromId!));

  const result = courses.map(c => ({
    id:                 c.id,
    title:              c.title,
    description:        c.description,
    thumbnailUrl:       c.thumbnailUrl,
    marketplaceCategory: c.marketplaceCategory,
    marketplaceShortDesc: c.marketplaceShortDesc,
    lessonCount:        c.modules.flatMap(m => m.lessons).length,
    moduleCount:        c.modules.length,
    lessonTypes:        [...new Set(c.modules.flatMap(m => m.lessons.map(l => l.type)))],
    enrollmentCount:    c._count.enrollments,
    alreadyImported:    importedIds.has(c.id),
  }));

  return NextResponse.json(result);
}
