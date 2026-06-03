import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasFeature, getMaxCourses, getMinPlanForFeature, getPlanLabel, type PlanFeature } from "@/lib/plans";

type GateError = NextResponse;

// Check if org has access to a feature. Returns a 403 response if not, null if OK.
export async function requireFeature(
  organizationId: string,
  feature: PlanFeature
): Promise<GateError | null> {
  const org = await prisma.organization.findUnique({
    where:  { id: organizationId },
    select: { plan: true },
  });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  if (!hasFeature(org.plan, feature)) {
    return NextResponse.json({
      error:       "PLAN_LIMIT",
      feature,
      currentPlan: org.plan,
      requiredPlan: getMinPlanForFeature(feature),
      message:     `Esta función requiere el plan ${getMinPlanForFeature(feature)} o superior. Tu plan actual es ${getPlanLabel(org.plan)}.`,
    }, { status: 403 });
  }
  return null;
}

// Check if org can create another course. Returns a 403 response if limit reached, null if OK.
export async function requireCourseSlot(organizationId: string): Promise<GateError | null> {
  const org = await prisma.organization.findUnique({
    where:  { id: organizationId },
    select: { plan: true },
  });
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  const max     = getMaxCourses(org.plan);
  const current = await prisma.course.count({ where: { organizationId, isMarketplace: false } });

  if (current >= max) {
    return NextResponse.json({
      error:       "PLAN_LIMIT",
      feature:     "maxCourses",
      currentPlan: org.plan,
      limit:       max,
      current,
      message:     `Has alcanzado el límite de ${max} cursos del plan ${getPlanLabel(org.plan)}. Actualiza tu plan para crear más cursos.`,
    }, { status: 403 });
  }
  return null;
}

// Convenience: get org plan without throwing
export async function getOrgPlan(organizationId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where:  { id: organizationId },
    select: { plan: true },
  });
  return org?.plan ?? null;
}
