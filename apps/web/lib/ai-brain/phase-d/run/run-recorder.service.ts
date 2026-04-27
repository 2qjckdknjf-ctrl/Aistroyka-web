/**
 * AI Brain Phase D — Run recorder service.
 * Records AI run outcomes. Fire-and-forget; does not block response.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createRunRecord } from "./run.repository";
import { captureVersionRefs } from "../versioning/version-refs";
import { logPhaseDRunRecorded } from "../telemetry/phase-d-telemetry";

export interface RecordRunParams {
  runId: string;
  tenantId: string;
  projectId?: string | null;
  userId?: string | null;
  route: string;
  mode: string;
  outputContractType?: string;
  degradedFlags?: string[];
  executionTimingMs?: number;
  validationResult?: "ok" | "partial" | "fail";
}

export function recordRun(
  supabase: SupabaseClient,
  params: RecordRunParams
): void {
  const versionRefs = captureVersionRefs();
  void createRunRecord(supabase, {
    runId: params.runId,
    tenantId: params.tenantId,
    projectId: params.projectId,
    userId: params.userId,
    route: params.route,
    mode: params.mode,
    outputContractType: params.outputContractType,
    degradedFlags: params.degradedFlags,
    executionTimingMs: params.executionTimingMs,
    validationResult: params.validationResult,
    versionRefs,
  })
    .then((record) => {
      if (record) {
        logPhaseDRunRecorded({
          runId: params.runId,
          tenantId: params.tenantId,
          route: params.route,
          mode: params.mode,
          versionRefCount: versionRefs.length,
        });
      }
    })
    .catch(() => {
      // Best-effort; do not fail request
    });
}
