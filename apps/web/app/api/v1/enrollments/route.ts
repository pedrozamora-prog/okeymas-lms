export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getOrgFromApiKey } from "@/lib/api-auth";

// GET /api/v1/enrollments — inscripciones con filtros
export async function GET(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: "API key inválida" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId   = searchParams.get("userId");
  const courseId = searchParams.get("courseId");
  const status   = searchParams.get("status");

  const enrollments = await prisma.enrollment.findMany({
    where: {
      user:   { organizationId: org.id },
      ...(userId   && { userId }),
      ...(courseId && { courseId }),
      ...(status   && { status: status as never }),
    },
    include: {
      user:   { select: { id: true, name: true, email: true, department: true } },
      course: { select: { id: true, title: true, isRequired: true } },
    },
    orderBy: { enrolledAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: enrollments, total: enrollments.length });
}
