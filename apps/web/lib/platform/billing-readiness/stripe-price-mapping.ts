/**
 * Stripe price mapping (Step 16).
 * Canonical plan + billing cycle -> Stripe price ID.
 * Config-driven via env. Invalid/missing -> controlled error.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { BillingCycle } from "./billing-readiness.types";

const ENV_PREFIX = "STRIPE_PRICE_";

function getEnv(name: string): string {
  if (typeof process === "undefined" || !process.env) return "";
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function envKey(planCode: PlanCode, billingCycle: BillingCycle): string {
  return `${ENV_PREFIX}${planCode.toUpperCase()}_${billingCycle.toUpperCase()}`;
}

/** Map of plan+cycle -> price id from env. */
const CACHE = new Map<string, string | null>();

/** Clear cache (for tests). */
export function __clearStripePriceCache(): void {
  CACHE.clear();
}

function getCached(planCode: PlanCode, billingCycle: BillingCycle): string | null {
  const key = `${planCode}:${billingCycle}`;
  if (CACHE.has(key)) return CACHE.get(key)!;
  const envName = envKey(planCode, billingCycle);
  const value = getEnv(envName);
  const result = value.length > 0 ? value : null;
  CACHE.set(key, result);
  return result;
}

/**
 * Get Stripe price ID for plan + billing cycle.
 * Returns null if not configured.
 */
export function getStripePriceId(planCode: PlanCode, billingCycle: BillingCycle): string | null {
  return getCached(planCode, billingCycle);
}

/**
 * Check if price mapping exists for plan + cycle.
 */
export function hasStripePriceMapping(planCode: PlanCode, billingCycle: BillingCycle): boolean {
  return getStripePriceId(planCode, billingCycle) !== null;
}

/**
 * Validate price mapping for live checkout.
 * Returns error message if invalid.
 */
export function validateStripePriceMapping(
  planCode: PlanCode,
  billingCycle: BillingCycle
): { valid: boolean; priceId: string | null; error: string | null } {
  const priceId = getStripePriceId(planCode, billingCycle);
  if (!priceId) {
    return {
      valid: false,
      priceId: null,
      error: `Missing STRIPE_PRICE_${planCode.toUpperCase()}_${billingCycle.toUpperCase()}`,
    };
  }
  if (priceId.length < 5) {
    return { valid: false, priceId, error: "Invalid price ID format" };
  }
  return { valid: true, priceId, error: null };
}

/**
 * Get all configured price mappings (for diagnostics).
 */
export function getStripePriceMappingDiagnostics(): Record<string, string | null> {
  const plans: PlanCode[] = ["client_personal", "team_contractor", "business_operations", "enterprise"];
  const cycles: BillingCycle[] = ["monthly", "annual"];
  const out: Record<string, string | null> = {};
  for (const p of plans) {
    for (const c of cycles) {
      out[`${p}:${c}`] = getStripePriceId(p, c);
    }
  }
  return out;
}
