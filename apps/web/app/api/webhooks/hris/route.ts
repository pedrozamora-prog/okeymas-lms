export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getOrgFromApiKey } from "@/lib/api-auth";
import { applyEnrollmentRules } from "@/lib/auto-enroll";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// ── Tipos de eventos soportados ───────────────────────────────────────────────
type HrisEvent =
  | "employee.created"
  | "employee.updated"
  | "employee.terminated"
  | "employee.reactivated";

interface HrisPayload {
  event: HrisEvent;
  data: {
    email: string;
    name?: string;
    department?: string | null;
    role?: string;
    employeeId?: string;
    [key: string]: unknown;
  };
}

// ── Normalizadores por proveedor ──────────────────────────────────────────────

function normalizeFactorial(body: Record<string, unknown>): HrisPayload | null {
  // Factorial webhook format: { type, attributes: { email, first_name, last_name, ... } }
  const type = body.type as string;
  const attrs = body.attributes as Record<string, unknown> | undefined;
  if (!attrs || !attrs.email) return null;

  const eventMap: Record<string, HrisEvent> = {
    "employee-created":    "employee.created",
    "employee-updated":    "employee.updated",
    "employee-terminated": "employee.terminated",
  };
  const event = eventMap[type];
  if (!event) return null;

  return {
    event,
    data: {
      email:      (attrs.email as string).toLowerCase(),
      name:       [attrs.first_name, attrs.last_name].filter(Boolean).join(" ") || undefined,
      department: attrs.team_name as string | undefined,
    },
  };
}

function normalizePersonio(body: Record<string, unknown>): HrisPayload | null {
  // Personio webhook format: { event, data: { employee: { email, first_name, last_name, ... } } }
  const event = body.event as string;
  const employee = (body.data as Record<string, unknown>)?.employee as Record<string, unknown> | undefined;
  if (!employee?.email) return null;

  const eventMap: Record<string, HrisEvent> = {
    "employee.created":    "employee.created",
    "employee.updated":    "employee.updated",
    "employee.terminated": "employee.terminated",
  };
  const normalized = eventMap[event];
  if (!normalized) return null;

  return {
    event: normalized,
    data: {
      email:      (employee.email as string).toLowerCase(),
      name:       [employee.first_name, employee.last_name].filter(Boolean).join(" ") || undefined,
      department: employee.department as string | undefined,
    },
  };
}

function normalizeGeneric(body: Record<string, unknown>): HrisPayload | null {
  // Generic format: { event, data: { email, name, department, role } }
  const event = body.event as string;
  const data  = body.data as Record<string, unknown> | undefined;
  if (!event || !data?.email) return null;

  const validEvents: HrisEvent[] = [
    "employee.created", "employee.updated", "employee.terminated", "employee.reactivated"
  ];
  if (!validEvents.includes(event as HrisEvent)) return null;

  return {
    event: event as HrisEvent,
    data: {
      email:      (data.email as string).toLowerCase(),
      name:       data.name as string | undefined,
      department: data.department as string | undefined,
      role:       data.role as string | undefined,
    },
  };
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const org = await getOrgFromApiKey(req);
  if (!org) return NextResponse.json({ error: "API key inválida" }, { status: 401 });

  if (!org.hrisSyncEnabled) {
    return NextResponse.json({ error: "Sincronización HRIS no activada" }, { status: 403 });
  }

  const provider = (req.nextUrl.searchParams.get("provider") ?? org.hrisProvider ?? "generic").toLowerCase();
  const rawBody  = await req.json() as Record<string, unknown>;

  let payload: HrisPayload | null = null;
  if (provider === "factorial")   payload = normalizeFactorial(rawBody);
  else if (provider === "personio") payload = normalizePersonio(rawBody);
  else                              payload = normalizeGeneric(rawBody);

  if (!payload) {
    await logSync(org.id, "unknown", "", "error", "Payload no reconocido", rawBody);
    return NextResponse.json({ error: "Payload no reconocido para el proveedor indicado" }, { status: 400 });
  }

  const { event, data } = payload;
  const { email, name, department, role } = data;

  try {
    let message = "";

    if (event === "employee.created") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Reactivar si estaba desactivado
        if (!existing.isActive) {
          await prisma.user.update({ where: { email }, data: { isActive: true } });
          message = `Empleado reactivado: ${email}`;
        } else {
          await logSync(org.id, event, email, "skipped", "El usuario ya existe y está activo", rawBody);
          return NextResponse.json({ ok: true, action: "skipped", message: "Usuario ya existe" });
        }
      } else {
        const deptId = await resolveDept(org.id, department);
        const hashedPassword = await bcrypt.hash(Math.random().toString(36) + Math.random().toString(36), 12);
        const userRole = (role as Role) || "EMPLOYEE";

        const newUser = await prisma.user.create({
          data: {
            name:           name?.trim() || email.split("@")[0],
            email,
            hashedPassword,
            role:           userRole,
            departmentId:   deptId,
            organizationId: org.id,
          },
        });
        await applyEnrollmentRules(newUser.id, org.id, newUser.role as Role, newUser.departmentId);
        message = `Empleado creado e inscrito en onboarding: ${email}`;
      }
    }

    else if (event === "employee.updated") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing || existing.organizationId !== org.id) {
        await logSync(org.id, event, email, "skipped", "Usuario no encontrado en esta organización", rawBody);
        return NextResponse.json({ ok: true, action: "skipped", message: "Usuario no encontrado" });
      }
      const updateData: Record<string, unknown> = {};
      if (name)       updateData.name = name.trim();
      if (department !== undefined) updateData.departmentId = await resolveDept(org.id, department);
      if (role)       updateData.role = role;
      await prisma.user.update({ where: { email }, data: updateData });
      message = `Empleado actualizado: ${email}`;
    }

    else if (event === "employee.terminated") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing || existing.organizationId !== org.id) {
        await logSync(org.id, event, email, "skipped", "Usuario no encontrado", rawBody);
        return NextResponse.json({ ok: true, action: "skipped", message: "Usuario no encontrado" });
      }
      await prisma.user.update({ where: { email }, data: { isActive: false } });
      message = `Empleado desactivado por baja: ${email}`;
    }

    else if (event === "employee.reactivated") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing || existing.organizationId !== org.id) {
        await logSync(org.id, event, email, "skipped", "Usuario no encontrado", rawBody);
        return NextResponse.json({ ok: true, action: "skipped", message: "Usuario no encontrado" });
      }
      await prisma.user.update({ where: { email }, data: { isActive: true } });
      message = `Empleado reactivado: ${email}`;
    }

    await logSync(org.id, event, email, "success", message, rawBody);
    return NextResponse.json({ ok: true, action: event, message });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    await logSync(org.id, event, email, "error", message, rawBody);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function resolveDept(orgId: string, dept: string | null | undefined): Promise<string | null> {
  if (!dept) return null;
  const found = await prisma.department.findFirst({
    where: {
      organizationId: orgId,
      OR: [{ id: dept }, { name: { equals: dept, mode: "insensitive" } }],
    },
    select: { id: true },
  });
  return found?.id ?? null;
}

async function logSync(
  organizationId: string,
  event: string,
  email: string,
  status: string,
  message: string,
  payload: unknown
) {
  try {
    await prisma.hrisSyncLog.create({
      data: { organizationId, event, email, status, message, payload: payload as never },
    });
  } catch {
    // log failure should never crash the main handler
  }
}
