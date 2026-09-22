/**
 * Feature flag for Agentic Foundation.
 * Stage 0 default: disabled.
 *
 * Modes (AGENTIC_FOUNDATION_MODE):
 * - disabled: always off (Stage 0)
 * - internal: enabled outside production
 * - staging: enabled on staging env, otherwise DB evaluation
 * - selected_tenant: tenant override / allowlist only (never percentage rollout)
 * - production: DB evaluation (rollout_percent / allowlist / override)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateFlags } from "@/lib/platform/flags/flags.service";
import { getTenantOverrides, listFlags } from "@/lib/platform/flags/flags.repository";
import { AGENTIC_FOUNDATION_FLAG_KEY, type AgenticFoundationMode } from "./types";

export function resolveAgenticFoundationMode(): AgenticFoundationMode {
  const raw = (process.env.AGENTIC_FOUNDATION_MODE ?? "disabled").trim().toLowerCase();
  switch (raw) {
    case "internal":
    case "staging":
    case "selected_tenant":
    case "production":
    case "disabled":
      return raw;
    default:
      return "disabled";
  }
}

function isStagingRuntime(): boolean {
  const env = (
    process.env.NEXT_PUBLIC_ENV ??
    process.env.APP_ENV ??
    process.env.NEXT_PUBLIC_VERCEL_ENV ??
    ""
  ).toLowerCase();
  return env === "staging";
}

function isNonProductionRuntime(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return nodeEnv !== "production";
}

export async function isAgenticFoundationEnabled(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<boolean> {
  const mode = resolveAgenticFoundationMode();
  switch (mode) {
    case "disabled":
      return false;
    case "internal":
      return isNonProductionRuntime();
    case "staging":
      if (isStagingRuntime()) return true;
      return evaluateDbFlag(supabase, tenantId);
    case "selected_tenant":
      return evaluateSelectedTenantFlag(supabase, tenantId);
    case "production":
      return evaluateDbFlag(supabase, tenantId);
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

async function evaluateDbFlag(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<boolean> {
  const flags = await evaluateFlags(supabase, tenantId);
  return flags[AGENTIC_FOUNDATION_FLAG_KEY]?.enabled === true;
}

/**
 * Selected-tenant rollout is intentionally stricter than production rollout.
 * Explicit tenant override wins; otherwise only the flag allowlist may enable it.
 * Percentage rollout is ignored so switching back from production cannot
 * accidentally leave unrelated tenants enabled.
 */
async function evaluateSelectedTenantFlag(
  supabase: SupabaseClient,
  tenantId: string | null
): Promise<boolean> {
  if (!tenantId) return false;
  const [flags, overrides] = await Promise.all([
    listFlags(supabase),
    getTenantOverrides(supabase, tenantId),
  ]);
  const override = overrides.find((row) => row.key === AGENTIC_FOUNDATION_FLAG_KEY);
  if (override) return override.enabled === true;
  const flag = flags.find((row) => row.key === AGENTIC_FOUNDATION_FLAG_KEY);
  return flag?.allowlist_tenant_ids?.includes(tenantId) === true;
}
