/**
 * Thin wrapper around AIService.analyzeImage for backward compatibility.
 * All vision analysis goes through Policy Engine → Provider Router → usage.
 * Server-only. Caller is responsible for quota/rate-limit when applicable.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { analyzeImage } from "@/lib/platform/ai/ai.service";
import type { AnalysisResult } from "./types";

export interface RunVisionOptions {
  tenantId?: string | null;
  userId?: string | null;
  traceId?: string | null;
  recordUsageWithAdmin?: import("@supabase/supabase-js").SupabaseClient | null;
}

/**
 * Run construction vision analysis on an image URL via AIService. Returns result or throws.
 * Requires admin client (from recordUsageWithAdmin or getAdminClient()).
 */
export async function runVisionAnalysis(
  imageUrl: string,
  options: RunVisionOptions = {}
): Promise<AnalysisResult> {
  const admin = options.recordUsageWithAdmin ?? getAdminClient();
  if (!admin) throw new Error("OPENAI_API_KEY is not configured");

  return analyzeImage(admin, {
    tenantId: options.tenantId ?? null,
    userId: options.userId ?? null,
    subscriptionTier: null,
    traceId: options.traceId ?? null,
  }, { imageUrl });
}
