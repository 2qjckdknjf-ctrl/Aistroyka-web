/**
 * Billing pilot cohort repository (Step 18, Step 19).
 * Hybrid: DB table first, env allowlist fallback.
 * No cohort = no live billing.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBillingPilotWorkspaceByWorkspaceId } from "./billing-pilot-cohort.repository";

const ENV_ALLOWLIST = "BILLING_PILOT_WORKSPACE_IDS";

function getEnvAllowlist(): Set<string> {
  if (typeof process === "undefined" || !process.env) return new Set();
  const v = process.env[ENV_ALLOWLIST]?.trim();
  if (!v) return new Set();
  return new Set(v.split(",").map((id) => id.trim()).filter(Boolean));
}

/**
 * Check if workspace is in pilot cohort (DB first, then env).
 * Returns { inCohort, liveCheckoutEnabled, webhookProcessingEnabled }.
 */
export async function getWorkspacePilotStatus(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{
  inCohort: boolean;
  liveCheckoutEnabled: boolean;
  webhookProcessingEnabled: boolean;
  source: "env" | "db" | "none";
}> {
  const dbRow = await getBillingPilotWorkspaceByWorkspaceId(supabase, workspaceId);
  if (dbRow) {
    return {
      inCohort: true,
      liveCheckoutEnabled: dbRow.liveCheckoutEnabled,
      webhookProcessingEnabled: dbRow.webhookProcessingEnabled,
      source: "db",
    };
  }

  const allowlist = getEnvAllowlist();
  const inCohort = allowlist.has(workspaceId);

  if (inCohort) {
    return {
      inCohort: true,
      liveCheckoutEnabled: true,
      webhookProcessingEnabled: true,
      source: "env",
    };
  }

  return {
    inCohort: false,
    liveCheckoutEnabled: false,
    webhookProcessingEnabled: false,
    source: "none",
  };
}

/**
 * Check if workspace is in pilot cohort (sync, env only).
 * For use when supabase not available (e.g. verification boundary).
 * Does not check DB.
 */
export function isWorkspaceInPilotCohortSync(workspaceId: string): boolean {
  const allowlist = getEnvAllowlist();
  return allowlist.has(workspaceId);
}
