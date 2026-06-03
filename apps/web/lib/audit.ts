import { type AuditAction, Prisma } from "@prisma/client";
import { headers } from "next/headers";

interface AuditLogParams {
  action: AuditAction;
  userId?: string;
  organizationId?: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export async function createAuditLog({
  action,
  userId,
  organizationId,
  entity,
  entityId,
  metadata,
  req,
}: AuditLogParams): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");

    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    // Extract IP and UA from Next.js headers (server components / route handlers)
    try {
      const hdrs = await headers();
      ipAddress =
        hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
        hdrs.get("x-real-ip") ??
        undefined;
      userAgent = hdrs.get("user-agent") ?? undefined;
    } catch {
      // headers() not available in this context (e.g. called from middleware)
      if (req) {
        ipAddress =
          req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
          req.headers.get("x-real-ip") ??
          undefined;
        userAgent = req.headers.get("user-agent") ?? undefined;
      }
    }

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        ipAddress,
        userAgent,
        userId: userId ?? undefined,
        organizationId: organizationId ?? undefined,
      },
    });
  } catch (err) {
    // Audit log failures must never break the main flow
    console.error("[AuditLog] failed to write:", err);
  }
}
