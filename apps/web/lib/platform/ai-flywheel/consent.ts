/**
 * Training consent filter — single shared export gate. Default deny.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { emitAudit } from "@/lib/observability/audit.service";

export const TRAINING_CONSENT_COLUMN = "ai_training_consent" as const;

export interface TrainingConsentFilter {
  /** Column name on tenants table */
  consentField: typeof TRAINING_CONSENT_COLUMN;
  /** Export paths must require explicit true */
  requireExplicitConsent: true;
}

/** Shared export filter descriptor. All export paths must use this helper. */
export function trainingConsentFilter(): TrainingConsentFilter {
  return {
    consentField: TRAINING_CONSENT_COLUMN,
    requireExplicitConsent: true,
  };
}

/** Returns true only when tenant has explicitly opted in. */
export function tenantHasTrainingConsent(consent: boolean | null | undefined): boolean {
  return consent === true;
}

export interface TenantConsentRow {
  id: string;
  ai_training_consent?: boolean | null;
}

/** Filter tenant rows to consent-eligible only. Default deny. */
export function filterTenantsWithTrainingConsent<T extends TenantConsentRow>(tenants: T[]): T[] {
  return tenants.filter((t) => tenantHasTrainingConsent(t.ai_training_consent));
}

export interface ConsentAuditParams {
  tenantId: string;
  userId?: string | null;
  traceId?: string | null;
  previousConsent: boolean;
  newConsent: boolean;
}

/** Audit consent changes — metadata only, no PII. */
export async function auditTrainingConsentChange(
  supabase: SupabaseClient,
  params: ConsentAuditParams
): Promise<void> {
  await emitAudit(supabase, {
    tenant_id: params.tenantId,
    user_id: params.userId ?? null,
    trace_id: params.traceId ?? null,
    action: "ai_training_consent_change",
    resource_type: "tenant",
    resource_id: params.tenantId,
    details: {
      previous_consent: params.previousConsent,
      new_consent: params.newConsent,
    },
  });
}
