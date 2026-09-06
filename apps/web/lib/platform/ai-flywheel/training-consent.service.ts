/**
 * Tenant AI training consent — read/update for owner/admin.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { auditTrainingConsentChange, tenantHasTrainingConsent } from "./consent";

export interface TrainingConsentState {
  aiTrainingConsent: boolean;
}

export async function getTrainingConsent(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TrainingConsentState | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("ai_training_consent")
    .eq("id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as { ai_training_consent?: boolean | null };
  return { aiTrainingConsent: tenantHasTrainingConsent(row.ai_training_consent) };
}

export interface UpdateTrainingConsentParams {
  tenantId: string;
  userId: string;
  traceId?: string | null;
  consent: boolean;
}

export async function updateTrainingConsent(
  admin: SupabaseClient,
  params: UpdateTrainingConsentParams
): Promise<{ ok: true; aiTrainingConsent: boolean } | { ok: false; error: string }> {
  const { data: current, error: readError } = await admin
    .from("tenants")
    .select("ai_training_consent")
    .eq("id", params.tenantId)
    .maybeSingle();

  if (readError || !current) {
    return { ok: false, error: "Tenant not found" };
  }

  const previous = tenantHasTrainingConsent(
    (current as { ai_training_consent?: boolean | null }).ai_training_consent
  );

  const { error: updateError } = await admin
    .from("tenants")
    .update({ ai_training_consent: params.consent })
    .eq("id", params.tenantId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (previous !== params.consent) {
    await auditTrainingConsentChange(admin, {
      tenantId: params.tenantId,
      userId: params.userId,
      traceId: params.traceId ?? null,
      previousConsent: previous,
      newConsent: params.consent,
    });
  }

  return { ok: true, aiTrainingConsent: params.consent };
}
