import type { SupabaseClient } from "@supabase/supabase-js";

export type IdentityProvider = "apple" | "telegram" | "google";

export type IdentityRow = {
  id: string;
  user_id: string;
  provider: IdentityProvider;
  identity_id: string | null;
  provider_user_id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AuthMethodSummary = {
  email: boolean;
  apple: boolean;
  telegram: boolean;
  google: boolean;
  linkedCount: number;
};

type DbLike = SupabaseClient & {
  from: SupabaseClient["from"];
};

export async function getUserIdentities(
  supabase: SupabaseClient,
  userId: string
): Promise<IdentityRow[]> {
  const db = supabase as DbLike;
  const { data, error } = await db
    .from("user_identities")
    .select("id, user_id, provider, identity_id, provider_user_id, email, username, full_name, avatar_url, metadata, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as IdentityRow[];
}

export function summarizeAuthMethods(userEmail: string | undefined, identities: IdentityRow[]): AuthMethodSummary {
  const methods = new Set<"email" | "apple" | "telegram" | "google">();
  if ((userEmail ?? "").trim().length > 0) methods.add("email");
  for (const identity of identities) {
    switch (identity.provider) {
      case "apple":
        methods.add("apple");
        break;
      case "telegram":
        methods.add("telegram");
        break;
      case "google":
        methods.add("google");
        break;
      default: {
        const _exhaustive: never = identity.provider;
        void _exhaustive;
        break;
      }
    }
  }
  return {
    email: methods.has("email"),
    apple: methods.has("apple"),
    telegram: methods.has("telegram"),
    google: methods.has("google"),
    linkedCount: methods.size,
  };
}

export async function linkIdentityRow(
  supabase: SupabaseClient,
  row: {
    user_id: string;
    provider: IdentityProvider;
    identity_id?: string | null;
    provider_user_id: string;
    email?: string | null;
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<{ ok: true } | { ok: false; code: "identity_conflict" | "db_error" }> {
  const db = supabase as DbLike;
  const { data: existing, error: existingError } = await db
    .from("user_identities")
    .select("user_id")
    .eq("provider", row.provider)
    .eq("provider_user_id", row.provider_user_id)
    .maybeSingle();
  if (existingError) return { ok: false, code: "db_error" };
  if (existing?.user_id && existing.user_id !== row.user_id) {
    return { ok: false, code: "identity_conflict" };
  }
  const nowIso = new Date().toISOString();
  const { error } = await db.from("user_identities").upsert(
    {
      user_id: row.user_id,
      provider: row.provider,
      identity_id: row.identity_id ?? null,
      provider_user_id: row.provider_user_id,
      email: row.email ?? null,
      username: row.username ?? null,
      full_name: row.full_name ?? null,
      avatar_url: row.avatar_url ?? null,
      metadata: row.metadata ?? {},
      updated_at: nowIso,
    },
    { onConflict: "provider,provider_user_id" }
  );
  if (error) return { ok: false, code: "db_error" };
  return { ok: true };
}

export async function unlinkIdentityRow(
  supabase: SupabaseClient,
  userId: string,
  provider: IdentityProvider
): Promise<boolean> {
  const db = supabase as DbLike;
  const { error } = await db
    .from("user_identities")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  return !error;
}

export async function unlinkSupabaseAuthProvider(
  supabase: SupabaseClient,
  provider: Exclude<IdentityProvider, "telegram">
): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  const identity = data.user?.identities?.find((item) => item.provider === provider);
  if (!identity) return true;
  const { error } = await supabase.auth.unlinkIdentity(identity);
  return !error;
}

export async function ensureOnboardingProfileExists(
  supabase: SupabaseClient,
  userId: string,
  fallback: { fullName?: string | null } = {}
): Promise<void> {
  const db = supabase as DbLike;
  const { data: existing } = await db
    .from("user_onboarding_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.user_id) return;
  const inferredCompany = (fallback.fullName ?? "").trim();
  await db.from("user_onboarding_profiles").insert({
    user_id: userId,
    persona: "other",
    company_name: inferredCompany.length > 0 ? inferredCompany : null,
    company_type: null,
    onboarding_completed: false,
  });
}

export async function hasTenantMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const db = supabase as DbLike;
  const [{ data: tenantOwned }, { data: member }] = await Promise.all([
    db.from("tenants").select("id").eq("user_id", userId).limit(1).maybeSingle(),
    db.from("tenant_members").select("tenant_id").eq("user_id", userId).limit(1).maybeSingle(),
  ]);
  return Boolean(tenantOwned?.id || member?.tenant_id);
}
