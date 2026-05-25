import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; organizationId: string } | undefined;

  if (!user || !["SUPER_ADMIN", "BRANCH_ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, thumbnailUrl, isRequired, order, departments } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      thumbnailUrl: thumbnailUrl?.trim() || null,
      isRequired: isRequired ?? false,
      order: order ?? 0,
      departments: departments ?? [],
      status: "DRAFT",
      organizationId: user.organizationId,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
