import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyText } from "./pii.classifier";
import type { PiiLevel } from "./pii.types";

export async function getPrivacySettings(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ pii_mode: string; redact_ai_prompts: boolean; allow_exports: boolean } | null> {
  const { data, error } = await supabase
    .from("privacy_settings")
    .select("pii_mode, redact_ai_prompts, allow_exports")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as { pii_mode: string; redact_ai_prompts: boolean; allow_exports: boolean };
}

/** Classify and optionally persist finding. Use service_role for insert. */
export async function classifyAndRecord(
  supabase: SupabaseClient,
  params: { tenantId: string; resourceType: string; resourceId: string; text: string }
): Promise<{ pii_level: PiiLevel; types: string[] }> {
  const classification = classifyText(params.text);
  if (classification.pii_level !== "none") {
    await supabase.from("pii_findings").insert({
      tenant_id: params.tenantId,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      pii_level: classification.pii_level,
      types: classification.types,
    });
  }
  return { pii_level: classification.pii_level, types: classification.types };
}

export async function listPiiFindings(
  supabase: SupabaseClient,
  tenantId: string,
  rangeDays: number
): Promise<{ id: string; resource_type: string; resource_id: string; pii_level: string; types: string[]; created_at: string }[]> {
  const start = new Date();
  start.setDate(start.getDate() - rangeDays);
  const { data, error } = await supabase
    .from("pii_findings")
    .select("id, resource_type, resource_id, pii_level, types, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as { id: string; resource_type: string; resource_id: string; pii_level: string; types: string[]; created_at: string }[];
}
