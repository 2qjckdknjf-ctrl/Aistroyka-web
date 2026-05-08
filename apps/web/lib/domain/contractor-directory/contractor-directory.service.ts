import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canManageProjects, isPortalOnlyStakeholderRole } from "@/lib/tenant/tenant.policy";
import { buildMetricsMap } from "./contractor-directory.metrics";
import type {
  ContractorDirectoryDetail,
  ContractorDirectoryListItem,
  TenantContractorProfileRow,
} from "./contractor-directory.types";

const MAX_CONTRACTORS = 150;

export function assertContractorDirectoryAccess(ctx: TenantContext): string | null {
  if (isPortalOnlyStakeholderRole(ctx)) return "Forbidden";
  if (!canManageProjects(ctx)) return "Insufficient rights";
  if (!ctx.tenantId) return "Tenant required";
  return null;
}

async function fetchContractorUserIds(
  supabase: SupabaseClient,
  tenantId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("role", "contractor")
    .eq("status", "active");
  if (error || !data) return [];
  const set = new Set((data as { user_id: string }[]).map((r) => r.user_id));
  return [...set].slice(0, MAX_CONTRACTORS);
}

async function fetchContractorMemberships(
  supabase: SupabaseClient,
  tenantId: string,
  userIds: string[]
): Promise<{ user_id: string; project_id: string }[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id, project_id")
    .eq("tenant_id", tenantId)
    .eq("role", "contractor")
    .eq("status", "active")
    .in("user_id", userIds);
  if (error || !data) return [];
  return data as { user_id: string; project_id: string }[];
}

async function fetchTasksForUsers(
  supabase: SupabaseClient,
  tenantId: string,
  userIds: string[]
): Promise<{ assigned_to: string | null; status: string; due_date: string | null; updated_at: string }[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("worker_tasks")
    .select("assigned_to, status, due_date, updated_at")
    .eq("tenant_id", tenantId)
    .in("assigned_to", userIds);
  if (error || !data) return [];
  return data as { assigned_to: string | null; status: string; due_date: string | null; updated_at: string }[];
}

async function fetchReportsForUsers(
  supabase: SupabaseClient,
  tenantId: string,
  userIds: string[]
): Promise<{ user_id: string; status: string }[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("worker_reports")
    .select("user_id, status")
    .eq("tenant_id", tenantId)
    .in("user_id", userIds);
  if (error || !data) return [];
  return data as { user_id: string; status: string }[];
}

async function fetchProfiles(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantContractorProfileRow[]> {
  const { data, error } = await supabase
    .from("tenant_contractor_profiles")
    .select(
      "id, tenant_id, user_id, company_name, specializations, phone, email, status, notes, created_at, updated_at"
    )
    .eq("tenant_id", tenantId);
  if (error || !data) return [];
  return data as TenantContractorProfileRow[];
}

function matchesFilters(
  item: ContractorDirectoryListItem,
  params: { q?: string; specialization?: string }
): boolean {
  const q = params.q?.trim().toLowerCase();
  const spec = params.specialization?.trim().toLowerCase();
  const company = (item.profile?.company_name ?? "").toLowerCase();
  const notes = (item.profile?.notes ?? "").toLowerCase();
  const specs = item.profile?.specializations ?? [];
  if (spec) {
    const hit = specs.some((s) => s.toLowerCase().includes(spec));
    if (!hit) return false;
  }
  if (q) {
    if (!item.user_id.toLowerCase().includes(q) && !company.includes(q) && !notes.includes(q)) {
      const specHit = specs.some((s) => s.toLowerCase().includes(q));
      if (!specHit) return false;
    }
  }
  return true;
}

export async function listContractorDirectory(
  supabase: SupabaseClient,
  ctx: TenantContext,
  filters: { q?: string; specialization?: string } = {}
): Promise<{ data: ContractorDirectoryListItem[] | null; error: string | null }> {
  const gate = assertContractorDirectoryAccess(ctx);
  if (gate) return { data: null, error: gate };
  const tenantId = ctx.tenantId!;

  const userIds = await fetchContractorUserIds(supabase, tenantId);
  const [memberships, tasks, reports, profileRows] = await Promise.all([
    fetchContractorMemberships(supabase, tenantId, userIds),
    fetchTasksForUsers(supabase, tenantId, userIds),
    fetchReportsForUsers(supabase, tenantId, userIds),
    fetchProfiles(supabase, tenantId),
  ]);

  const metricsMap = buildMetricsMap({ userIds, tasks, reports, memberships });
  const profileByUser = new Map<string, TenantContractorProfileRow>();
  for (const p of profileRows) profileByUser.set(p.user_id, p);

  let items: ContractorDirectoryListItem[] = userIds.map((user_id) => ({
    user_id,
    profile: profileByUser.get(user_id) ?? null,
    metrics: metricsMap.get(user_id)!,
  }));

  items = items.filter((it) => matchesFilters(it, filters));

  items.sort((a, b) => {
    const an = (a.profile?.company_name ?? "").trim() || a.user_id;
    const bn = (b.profile?.company_name ?? "").trim() || b.user_id;
    return an.localeCompare(bn);
  });

  return { data: items, error: null };
}

export async function getContractorDirectoryDetail(
  supabase: SupabaseClient,
  ctx: TenantContext,
  userId: string
): Promise<{ data: ContractorDirectoryDetail | null; error: string | null }> {
  const gate = assertContractorDirectoryAccess(ctx);
  if (gate) return { data: null, error: gate };
  const tenantId = ctx.tenantId!;

  const allowedIds = await fetchContractorUserIds(supabase, tenantId);
  if (!allowedIds.includes(userId)) return { data: null, error: "Not a contractor for this tenant" };

  const memberships = await fetchContractorMemberships(supabase, tenantId, [userId]);
  const [tasks, reports, profiles] = await Promise.all([
    fetchTasksForUsers(supabase, tenantId, [userId]),
    fetchReportsForUsers(supabase, tenantId, [userId]),
    fetchProfiles(supabase, tenantId),
  ]);
  const metricsMap = buildMetricsMap({ userIds: [userId], tasks, reports, memberships });
  const profile = profiles.find((p) => p.user_id === userId) ?? null;

  return {
    data: {
      user_id: userId,
      profile,
      metrics: metricsMap.get(userId)!,
    },
    error: null,
  };
}

export type ContractorProfilePatch = {
  company_name?: string;
  specializations?: string[];
  phone?: string;
  email?: string;
  notes?: string;
  status?: TenantContractorProfileRow["status"];
};

export async function upsertContractorProfile(
  supabase: SupabaseClient,
  ctx: TenantContext,
  userId: string,
  patch: ContractorProfilePatch
): Promise<{ data: TenantContractorProfileRow | null; error: string | null }> {
  const gate = assertContractorDirectoryAccess(ctx);
  if (gate) return { data: null, error: gate };
  const tenantId = ctx.tenantId!;

  const allowedIds = await fetchContractorUserIds(supabase, tenantId);
  if (!allowedIds.includes(userId)) return { data: null, error: "Not a contractor for this tenant" };

  const { data: existingRow, error: exErr } = await supabase
    .from("tenant_contractor_profiles")
    .select(
      "id, tenant_id, user_id, company_name, specializations, phone, email, status, notes, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (exErr) return { data: null, error: exErr.message };

  const now = new Date().toISOString();
  const base = (existingRow ?? null) as TenantContractorProfileRow | null;
  const row = {
    tenant_id: tenantId,
    user_id: userId,
    company_name: patch.company_name ?? base?.company_name ?? "",
    specializations: patch.specializations ?? base?.specializations ?? [],
    phone: patch.phone ?? base?.phone ?? "",
    email: patch.email ?? base?.email ?? "",
    notes: patch.notes ?? base?.notes ?? "",
    status: patch.status ?? base?.status ?? "active",
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("tenant_contractor_profiles")
    .upsert(row, { onConflict: "tenant_id,user_id" })
    .select(
      "id, tenant_id, user_id, company_name, specializations, phone, email, status, notes, created_at, updated_at"
    )
    .single();

  if (error || !data) return { data: null, error: error?.message ?? "Save failed" };
  return { data: data as TenantContractorProfileRow, error: null };
}
