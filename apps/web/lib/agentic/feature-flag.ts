/**
 * Feature flag for Agentic Foundation.
 * Stage 0 default: disabled.
 *
 * Modes (AGENTIC_FOUNDATION_MODE):
 * - disabled: always off (Stage 0)
 * - internal: enabled outside production
 * - staging: enabled on staging env, otherwise DB evaluation
 * - selected_tenant: DB allowlist / tenant override only
 * - production: DB evaluation (rollout_percent / allowlist / override)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateFlags } from "@/lib/platform/flags/flags.service";
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
