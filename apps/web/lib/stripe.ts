import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

// Price IDs from Stripe dashboard
export const STRIPE_PRICES = {
  STARTER: {
    monthly: "price_1TeXmyAC17FFNT4uCXLZREDG",
    annual:  "price_1TeXllAC17FFNT4ufqTWaYfY",
  },
  PROFESSIONAL: {
    monthly: "price_1TeXo7AC17FFNT4u9qPYvtFt",
    annual:  "price_1TeXyVAC17FFNT4uqaZuBDlw",
  },
  CHAIN: {
    monthly: "price_1TeY2zAC17FFNT4ui5yZ8GJ4",
    annual:  "price_1TeY4JAC17FFNT4uJ0dXJva8",
  },
} as const;

// Map price ID → plan name
export const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TeXmyAC17FFNT4uCXLZREDG": "PROFESSIONAL",
  "price_1TeXllAC17FFNT4ufqTWaYfY": "PROFESSIONAL",
  "price_1TeXo7AC17FFNT4u9qPYvtFt": "PROFESSIONAL",
  "price_1TeXyVAC17FFNT4uqaZuBDlw": "PROFESSIONAL",
  "price_1TeY2zAC17FFNT4ui5yZ8GJ4": "CHAIN",
  "price_1TeY4JAC17FFNT4uJ0dXJva8": "CHAIN",
};

// Correct map: price ID → OrgPlan
export const PRICE_ID_TO_PLAN: Record<string, string> = {
  "price_1TeXmyAC17FFNT4uCXLZREDG": "STARTER",
  "price_1TeXllAC17FFNT4ufqTWaYfY": "STARTER",
  "price_1TeXo7AC17FFNT4u9qPYvtFt": "PROFESSIONAL",
  "price_1TeXyVAC17FFNT4uqaZuBDlw": "PROFESSIONAL",
  "price_1TeY2zAC17FFNT4ui5yZ8GJ4": "CHAIN",
  "price_1TeY4JAC17FFNT4uJ0dXJva8": "CHAIN",
};

export const PLAN_PRICES_USD = {
  STARTER:      { monthly: 159,  annual: 1590 },
  PROFESSIONAL: { monthly: 319,  annual: 3190 },
  CHAIN:        { monthly: 549,  annual: 5490 },
  ENTERPRISE:   { monthly: null, annual: null },
};
