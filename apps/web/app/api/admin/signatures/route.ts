import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;

  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const userId   = searchParams.get("userId");

  const where = {
    course: { organizationId: user.organizationId },
    ...(courseId && { courseId }),
    ...(userId   && { userId }),
  };

  const signatures = await prisma.courseSignature.findMany({
    where,
    orderBy: { signedAt: "desc" },
    include: {
      user:   { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  return NextResponse.json({ signatures });
}
