import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getAdmin(s: unknown): { role?: string } | null {
  const u = (s as { user?: { role?: string } } | null)?.user;
  return ["SUPER_ADMIN", "BRANCH_ADMIN"].includes(u?.role ?? "") ? u! : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!getAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, description, competencyIds, userIds } = await req.json() as {
    name?:          string;
    description?:   string;
    competencyIds?: string[];
    userIds?:       string[];
  };

  await prisma.$transaction(async tx => {
    if (name) await tx.jobRole.update({ where: { id }, data: { name, description } });

    if (competencyIds !== undefined) {
      await tx.roleCompetency.deleteMany({ where: { jobRoleId: id } });
      if (competencyIds.length) {
        await tx.roleCompetency.createMany({
          data: competencyIds.map(cid => ({ jobRoleId: id, competencyId: cid })),
        });
      }
    }

    if (userIds !== undefined) {
      await tx.userJobRole.deleteMany({ where: { jobRoleId: id } });
      if (userIds.length) {
        await tx.userJobRole.createMany({
          data: userIds.map(uid => ({ jobRoleId: id, userId: uid })),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!getAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.jobRole.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
