/**
 * Wave 4 Step 19 closure — safe actor labels for internal traceability.
 * Resolves display strings only for users scoped to the tenant/project; uses Auth Admin when configured.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";

const MAX_LABEL_LEN = 56;

/** Shape returned by auth.admin.getUserById */
export function actorLabelFromAuthUser(user: User | null | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === "string"
      ? meta.full_name.trim()
      : typeof meta?.name === "string"
        ? meta.name.trim()
        : "";
  if (fullName.length > 0) {
    return fullName.length > MAX_LABEL_LEN ? `${fullName.slice(0, MAX_LABEL_LEN - 1)}…` : fullName;
  }
  const email = user.email?.trim();
  if (email && email.includes("@")) {
    const local = email.split("@")[0] ?? "";
    if (local.length > 0) {
      return local.length > MAX_LABEL_LEN ? `${local.slice(0, MAX_LABEL_LEN - 1)}…` : local;
    }
  }
  return null;
}

/**
 * Collect user ids that may be labeled: tenant members, project members, or project stakeholders
 * linked to this project (prevents resolving arbitrary UUIDs via admin).
 */
export async function collectTenantProjectScopedUserIds(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  candidateIds: string[]
): Promise<Set<string>> {
  const uniq = [...new Set(candidateIds)].filter(Boolean);
  const allowed = new Set<string>();
  if (uniq.length === 0) return allowed;

  const { data: tenantRow } = await supabase.from("tenants").select("user_id").eq("id", tenantId).maybeSingle();
  const tenantOwnerId = (tenantRow as { user_id: string | null } | null)?.user_id ?? null;
  if (tenantOwnerId && uniq.includes(tenantOwnerId)) allowed.add(tenantOwnerId);

  const chunk = 100;
  for (let i = 0; i < uniq.length; i += chunk) {
    const slice = uniq.slice(i, i + chunk);
    const [tmRes, pmRes, psRes] = await Promise.all([
      supabase.from("tenant_members").select("user_id").eq("tenant_id", tenantId).in("user_id", slice),
      supabase
        .from("project_members")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .eq("project_id", projectId)
        .eq("status", "active")
        .in("user_id", slice),
      supabase
        .from("project_stakeholders")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .eq("project_id", projectId)
        .not("user_id", "is", null)
        .in("user_id", slice),
    ]);
    for (const r of (tmRes.data ?? []) as { user_id: string }[]) allowed.add(r.user_id);
    for (const r of (pmRes.data ?? []) as { user_id: string }[]) allowed.add(r.user_id);
    for (const r of (psRes.data ?? []) as { user_id: string }[]) {
      if (r.user_id) allowed.add(r.user_id);
    }
  }
  return allowed;
}

/**
 * Resolve actor_id → human-readable label for allowed user ids.
 * If service role is not configured, returns an empty map (callers keep UUID fallback).
 */
export async function resolveTraceActorLabels(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  actorIds: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const candidates = actorIds.filter((x): x is string => typeof x === "string" && x.length > 0);
  const allowed = await collectTenantProjectScopedUserIds(supabase, tenantId, projectId, candidates);
  const toResolve = [...allowed].filter((id) => candidates.includes(id));
  if (toResolve.length === 0) return out;

  const admin = getAdminClient();
  if (!admin) return out;

  const chunk = 12;
  for (let i = 0; i < toResolve.length; i += chunk) {
    const slice = toResolve.slice(i, i + chunk);
    const results = await Promise.all(
      slice.map(async (userId) => {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (error || !data?.user) return { userId, label: null as string | null };
        return { userId, label: actorLabelFromAuthUser(data.user) };
      })
    );
    for (const { userId, label } of results) {
      if (label) out.set(userId, label);
    }
  }
  return out;
}
