import type { SupabaseClient } from "@supabase/supabase-js";
import { getTenantForCurrentUser } from "@/lib/api/engine";

export const ONBOARDING_PERSONAS = [
  "customer",
  "developer",
  "contractor",
  "supervisor",
  "other",
  "invited_worker_manager",
] as const;

export type OnboardingPersona = (typeof ONBOARDING_PERSONAS)[number];

export function isOnboardingPersona(value: string): value is OnboardingPersona {
  return (ONBOARDING_PERSONAS as readonly string[]).includes(value);
}

export async function getOnboardingProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  persona: OnboardingPersona | null;
  company_name: string | null;
  company_type: string | null;
  onboarding_completed: boolean;
  tenant_id: string | null;
} | null> {
  const db = supabase as any;
  const { data, error } = await db
    .from("user_onboarding_profiles")
    .select("persona, company_name, company_type, onboarding_completed, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    persona: isOnboardingPersona(data.persona) ? data.persona : null,
    company_name: data.company_name ?? null,
    company_type: data.company_type ?? null,
    onboarding_completed: data.onboarding_completed === true,
    tenant_id: data.tenant_id ?? null,
  };
}

export async function shouldShowOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const [profile, tenantId] = await Promise.all([
    getOnboardingProfile(supabase, userId),
    getTenantForCurrentUser(supabase),
  ]);
  if (!profile) return !tenantId;
  if (!profile.onboarding_completed) return true;
  if (!tenantId && profile.persona !== "customer") return true;
  return false;
}
