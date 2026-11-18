/**
 * Public marketing pricing catalog.
 *
 * Amounts come from the live Stripe products already provisioned for AISTROYKA
 * (Starter €49/mo, mid-tier €149/mo). Checkout still resolves Stripe Price IDs
 * from env (`STRIPE_PRICE_STARTER` / `STRIPE_PRICE_BUSINESS`); this file is the
 * only place public UI may read a list price.
 *
 * Mapping:
 * - Public Starter → checkout `starter`
 * - Public Pro (recommended) → checkout `business` (existing mid-tier SKU / PRO)
 * - Public Business has no distinct Stripe SKU yet (PHASE12) → sales/pilot
 * - Enterprise is sales-led; never show a fixed public list price
 */

export const PUBLIC_PLAN_IDS = ["starter", "pro", "business", "enterprise"] as const;
export type PublicPlanId = (typeof PUBLIC_PLAN_IDS)[number];

export const SELF_SERVE_PLAN_IDS = ["starter", "pro"] as const;
export type SelfServePlanId = (typeof SELF_SERVE_PLAN_IDS)[number];

export const STRIPE_CHECKOUT_PLAN_KEYS = ["starter", "business"] as const;
export type StripeCheckoutPlanKey = (typeof STRIPE_CHECKOUT_PLAN_KEYS)[number];

export type PricingCurrency = "EUR";
export type PricingBillingUnit = "month";

type PlanBase = {
  id: PublicPlanId;
  name: string;
  currency: PricingCurrency;
  billingUnit: PricingBillingUnit;
  recommended: boolean;
};

export type SelfServePlan = PlanBase & {
  id: SelfServePlanId;
  monthlyAmount: number;
  checkoutPlanKey: StripeCheckoutPlanKey;
  checkoutEnabled: true;
};

export type SalesLedPlan = PlanBase & {
  id: "business" | "enterprise";
  monthlyAmount: null;
  checkoutPlanKey: null;
  checkoutEnabled: false;
};

export type PublicPlan = SelfServePlan | SalesLedPlan;

const CATALOG: Record<PublicPlanId, PublicPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    currency: "EUR",
    billingUnit: "month",
    monthlyAmount: 49,
    checkoutPlanKey: "starter",
    checkoutEnabled: true,
    recommended: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    currency: "EUR",
    billingUnit: "month",
    monthlyAmount: 149,
    checkoutPlanKey: "business",
    checkoutEnabled: true,
    recommended: true,
  },
  business: {
    id: "business",
    name: "Business",
    currency: "EUR",
    billingUnit: "month",
    monthlyAmount: null,
    checkoutPlanKey: null,
    checkoutEnabled: false,
    recommended: false,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    currency: "EUR",
    billingUnit: "month",
    monthlyAmount: null,
    checkoutPlanKey: null,
    checkoutEnabled: false,
    recommended: false,
  },
};

export function isPublicPlanId(value: string): value is PublicPlanId {
  return (PUBLIC_PLAN_IDS as readonly string[]).includes(value);
}

export function isSelfServePlanId(value: string): value is SelfServePlanId {
  return (SELF_SERVE_PLAN_IDS as readonly string[]).includes(value);
}

export function getPublicPlan(id: PublicPlanId): PublicPlan {
  return CATALOG[id];
}

export function getSelfServePlan(id: SelfServePlanId): SelfServePlan {
  const plan = CATALOG[id];
  if (!plan.checkoutEnabled) {
    throw new Error(`Plan ${id} is not self-serve`);
  }
  return plan;
}

/** Server-side lookup. Ignores client-supplied amounts. */
export function lookupPublicPlan(raw: unknown): PublicPlan | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim().toLowerCase();
  if (!isPublicPlanId(id)) return null;
  return CATALOG[id];
}

export function getSelfServePlans(): SelfServePlan[] {
  return SELF_SERVE_PLAN_IDS.map((id) => getSelfServePlan(id));
}

export function getPublicPlans(): PublicPlan[] {
  return PUBLIC_PLAN_IDS.map((id) => CATALOG[id]);
}

export function getCheckoutPlanKey(raw: unknown): StripeCheckoutPlanKey | null {
  const plan = lookupPublicPlan(raw);
  if (!plan || !plan.checkoutEnabled) return null;
  return plan.checkoutPlanKey;
}

export function formatPlanPrice(plan: SelfServePlan, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.monthlyAmount);
}

export function formatCheckoutTotal(plan: SelfServePlan, locale: string): string {
  return formatPlanPrice(plan, locale);
}

export function buildPaidPlanCtaText(input: {
  chooseLabel: string;
  planName: string;
  formattedPrice: string;
  perUnit: string;
}): string {
  return `${input.chooseLabel} ${input.planName} — ${input.formattedPrice}/${input.perUnit}`;
}

export function paidPlanCtaContainsPrice(cta: string, formattedPrice: string): boolean {
  return cta.includes(formattedPrice);
}

export function enterpriseDetailPath(locale: string): string {
  return `/${locale}/pricing/enterprise`;
}

export function legacyEnterprisePath(locale: string): string {
  return `/${locale}/enterprise`;
}

export function subscribePath(locale: string, planId: SelfServePlanId): string {
  return `/${locale}/subscribe?plan=${planId}`;
}

export function localizedPublicPath(locale: string, path: string): string {
  if (path === "" || path === "/") return `/${locale}`;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${suffix}`;
}
