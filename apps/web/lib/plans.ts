export type PlanFeature =
  | "marketplace"
  | "sso"
  | "branchingPaths"
  | "digitalSignature"
  | "auditLogs"
  | "videoAnalytics"
  | "advancedQuiz"
  | "competencies"
  | "whatsapp"
  | "authoringTool"
  | "hris"
  | "b2cSales"
  | "webhooks"
  | "alerts"
  | "enrollmentRules";

interface PlanConfig {
  label:      string;
  maxUsers:   number;
  maxCourses: number;
  features:   Record<PlanFeature, boolean>;
}

export const PLAN_CONFIG: Record<string, PlanConfig> = {
  STARTER: {
    label:      "Starter",
    maxUsers:   50,
    maxCourses: 5,
    features: {
      marketplace:      true,
      sso:              false,
      branchingPaths:   false,
      digitalSignature: false,
      auditLogs:        false,
      videoAnalytics:   false,
      advancedQuiz:     false,
      competencies:     false,
      whatsapp:         false,
      authoringTool:    false,
      hris:             false,
      b2cSales:         false,
      webhooks:         false,
      alerts:           false,
      enrollmentRules:  false,
    },
  },
  PROFESSIONAL: {
    label:      "Professional",
    maxUsers:   150,
    maxCourses: 25,
    features: {
      marketplace:      true,
      sso:              false,
      branchingPaths:   true,
      digitalSignature: true,
      auditLogs:        false,
      videoAnalytics:   true,
      advancedQuiz:     true,
      competencies:     true,
      whatsapp:         true,
      authoringTool:    false,
      hris:             false,
      b2cSales:         false,
      webhooks:         true,
      alerts:           true,
      enrollmentRules:  true,
    },
  },
  CHAIN: {
    label:      "Chain",
    maxUsers:   400,
    maxCourses: 99999,
    features: {
      marketplace:      true,
      sso:              false,
      branchingPaths:   true,
      digitalSignature: true,
      auditLogs:        true,
      videoAnalytics:   true,
      advancedQuiz:     true,
      competencies:     true,
      whatsapp:         true,
      authoringTool:    true,
      hris:             false,
      b2cSales:         true,
      webhooks:         true,
      alerts:           true,
      enrollmentRules:  true,
    },
  },
  ENTERPRISE: {
    label:      "Enterprise",
    maxUsers:   999999,
    maxCourses: 999999,
    features: {
      marketplace:      true,
      sso:              true,
      branchingPaths:   true,
      digitalSignature: true,
      auditLogs:        true,
      videoAnalytics:   true,
      advancedQuiz:     true,
      competencies:     true,
      whatsapp:         true,
      authoringTool:    true,
      hris:             true,
      b2cSales:         true,
      webhooks:         true,
      alerts:           true,
      enrollmentRules:  true,
    },
  },
};

export function hasFeature(plan: string, feature: PlanFeature): boolean {
  return PLAN_CONFIG[plan]?.features[feature] ?? false;
}

export function getMaxUsers(plan: string): number {
  return PLAN_CONFIG[plan]?.maxUsers ?? 15;
}

export function getMaxCourses(plan: string): number {
  return PLAN_CONFIG[plan]?.maxCourses ?? 5;
}

export function getPlanLabel(plan: string): string {
  return PLAN_CONFIG[plan]?.label ?? plan;
}

// Returns the minimum plan name that includes a given feature
export function getMinPlanForFeature(feature: PlanFeature): string {
  const order = ["STARTER", "PROFESSIONAL", "CHAIN", "ENTERPRISE"];
  for (const plan of order) {
    if (PLAN_CONFIG[plan]?.features[feature]) return PLAN_CONFIG[plan].label;
  }
  return "Enterprise";
}
