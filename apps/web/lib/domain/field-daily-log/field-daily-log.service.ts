import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { canReadProjects, isPortalOnlyStakeholderRole } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import * as repo from "./field-daily-log.repository";
import {
  fieldDailyLogConfirmBlockedReason,
  fieldDailyLogEditBlockedReason,
  isValidWorkDate,
  type CreateFieldDailyLogInput,
  type FieldDailyLog,
  type UpdateFieldDailyLogDraftInput,
} from "./field-daily-log.types";

function denyPortal(ctx: TenantContext): string | null {
  if (isPortalOnlyStakeholderRole(ctx)) return "Portal access not allowed";
  return null;
}

function requireReader(ctx: TenantContext): string | null {
  const portal = denyPortal(ctx);
  if (portal) return portal;
  if (!canReadProjects(ctx)) return "Insufficient rights";
  if (!ctx.tenantId) return "Tenant required";
  return null;
}

function hasCreateBody(input: CreateFieldDailyLogInput): boolean {
  const text =
    (input.note?.trim() || "") +
    (input.summary?.trim() || "") +
    (input.work_done?.trim() || "") +
    (input.blockers?.trim() || "") +
    (input.weather?.trim() || "");
  const media = input.media_refs?.length ?? 0;
  return text.length > 0 || media > 0;
}

export async function listFieldDailyLogs(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  opts?: { work_date?: string; status?: string; limit?: number }
): Promise<{ data: FieldDailyLog[]; error: string }> {
  const gate = requireReader(ctx);
  if (gate) return { data: [], error: gate };

  const project = await getProjectById(supabase, projectId, ctx.tenantId!);
  if (!project) return { data: [], error: "Project not found" };

  const data = await repo.listByProject(supabase, projectId, ctx.tenantId!, opts);
  return { data, error: "" };
}

export async function createFieldDailyLogDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: CreateFieldDailyLogInput
): Promise<{ data: FieldDailyLog | null; error: string }> {
  const gate = requireReader(ctx);
  if (gate) return { data: null, error: gate };

  if (!isValidWorkDate(input.work_date)) {
    return { data: null, error: "work_date required (YYYY-MM-DD)" };
  }
  if (!hasCreateBody(input)) {
    return { data: null, error: "note, structured fields, or media_refs required" };
  }

  const project = await getProjectById(supabase, input.project_id, ctx.tenantId!);
  if (!project) return { data: null, error: "Project not found" };

  const data = await repo.create(supabase, ctx.tenantId!, ctx.userId ?? null, input);
  if (!data) return { data: null, error: "Create failed" };
  return { data, error: "" };
}

export async function updateFieldDailyLogDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  logId: string,
  input: UpdateFieldDailyLogDraftInput
): Promise<{ data: FieldDailyLog | null; error: string }> {
  const gate = requireReader(ctx);
  if (gate) return { data: null, error: gate };

  const existing = await repo.getById(supabase, logId, ctx.tenantId!);
  if (!existing || existing.project_id !== projectId) {
    return { data: null, error: "Not found" };
  }

  const blocked = fieldDailyLogEditBlockedReason(existing.status);
  if (blocked) return { data: null, error: blocked };

  if (input.work_date !== undefined && !isValidWorkDate(input.work_date)) {
    return { data: null, error: "work_date required (YYYY-MM-DD)" };
  }

  const data = await repo.updateDraft(supabase, logId, ctx.tenantId!, input);
  if (!data) return { data: null, error: "Update failed" };
  return { data, error: "" };
}

export async function confirmFieldDailyLog(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  logId: string
): Promise<{ data: FieldDailyLog | null; error: string }> {
  const gate = requireReader(ctx);
  if (gate) return { data: null, error: gate };

  const existing = await repo.getById(supabase, logId, ctx.tenantId!);
  if (!existing || existing.project_id !== projectId) {
    return { data: null, error: "Not found" };
  }

  const blocked = fieldDailyLogConfirmBlockedReason(existing.status);
  if (blocked) return { data: null, error: blocked };

  const data = await repo.confirm(supabase, logId, ctx.tenantId!, ctx.userId ?? null);
  if (!data) return { data: null, error: "Confirm failed" };
  return { data, error: "" };
}

export async function getFieldDailyLogById(
  supabase: SupabaseClient,
  ctx: TenantContext,
  projectId: string,
  logId: string
): Promise<{ data: FieldDailyLog | null; error: string }> {
  const gate = requireReader(ctx);
  if (gate) return { data: null, error: gate };

  const data = await repo.getById(supabase, logId, ctx.tenantId!);
  if (!data || data.project_id !== projectId) return { data: null, error: "Not found" };
  return { data, error: "" };
}
