import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const courses = await prisma.course.findMany({
    where:  { isPublic: true, status: "PUBLISHED" },
    select: {
      id:           true,
      title:        true,
      description:  true,
      thumbnailUrl: true,
      price:        true,
      currency:     true,
      organization: { select: { name: true, logoUrl: true } },
      modules:      { select: { _count: { select: { lessons: true } } } },
      _count:       { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}
