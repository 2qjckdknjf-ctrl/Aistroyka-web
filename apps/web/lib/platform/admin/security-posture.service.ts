/**
 * Security posture service - handles security posture data for admin.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { getServerConfig } from "@/lib/config/server";
import * as repo from "./security-posture.repository";
import type { SecurityPostureData } from "./security-posture.repository";

export async function getSecurityPosture(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: SecurityPostureData | null; error: string }> {
  if (!ctx.tenantId) {
    return { data: null, error: "Unauthorized" };
  }

  const config = getServerConfig();
  const debugEnabled = Boolean(process.env.DEBUG_AUTH === "true" || process.env.DEBUG_DIAG === "true");

  const posture = await repo.getSecurityPosture(supabase, ctx.tenantId);
  posture.debug_enabled_in_prod = config.NODE_ENV === "production" && debugEnabled;

  return { data: posture, error: "" };
}
