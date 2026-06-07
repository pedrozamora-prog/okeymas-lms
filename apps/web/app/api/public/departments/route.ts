import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Public endpoint — used by self-registration form (no auth needed)
export async function GET() {
  const org = await prisma.organization.findFirst({ select: { id: true } });
  if (!org) return NextResponse.json([]);

  const departments = await prisma.department.findMany({
    where:   { organizationId: org.id },
    orderBy: { name: "asc" },
    select:  { id: true, name: true },
  });

  return NextResponse.json(departments);
}
