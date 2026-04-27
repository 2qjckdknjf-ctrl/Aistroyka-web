/**
 * Canonical add-on model (domain and config only; no pricing).
 */

import type { AddOnCode } from "@aistroyka/contracts";

export const ADD_ON_CODES: AddOnCode[] = [
  "extra_users",
  "extra_projects",
  "extra_storage",
  "ai_expansion",
  "premium_onboarding",
  "premium_support",
  "future_budget_cost",
  "integration_pack",
  "security_pack",
  "sla_pack",
];

export const ADD_ON_LABELS: Record<AddOnCode, string> = {
  extra_users: "Extra users",
  extra_projects: "Extra projects",
  extra_storage: "Extra storage",
  ai_expansion: "AI expansion",
  premium_onboarding: "Premium onboarding",
  premium_support: "Premium support",
  future_budget_cost: "Future budget / cost",
  integration_pack: "Integration pack",
  security_pack: "Security pack",
  sla_pack: "SLA pack",
};

export interface AddOnConfig {
  code: AddOnCode;
  label: string;
}

/** Get add-on config by code. */
export function getAddOnConfig(code: AddOnCode): AddOnConfig {
  return { code, label: ADD_ON_LABELS[code] };
}
