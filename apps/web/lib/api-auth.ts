import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function getOrgFromApiKey(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const key  = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!key) return null;

  const org = await prisma.organization.findUnique({
    where: { apiKey: key },
  });

  return org?.isActive ? org : null;
}
