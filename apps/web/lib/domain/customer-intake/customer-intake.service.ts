import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import type {
  CreateCustomerIntakeInput,
  CustomerIntakeDraft,
  CustomerIntakeLocation,
  CustomerIntakeMediaRef,
} from "./customer-intake.types";

const LOCATION_PRECISIONS: CustomerIntakeLocation["precision"][] = [
  "address",
  "city",
  "region",
  "coordinates",
];
const MEDIA_KINDS: CustomerIntakeMediaRef["kind"][] = ["image", "video", "document"];
const MAX_QUESTIONS = 20;
const MAX_QUESTION_LENGTH = 500;
const MAX_MEDIA_REFS = 20;
const MAX_MEDIA_ID_LENGTH = 128;
const MAX_MEDIA_URL_LENGTH = 2048;
const MEDIA_KEYS = new Set(["kind", "url", "media_id"]);

function parseLocation(value: unknown): { location: CustomerIntakeLocation } | { error: string } {
  if (value == null) return { location: { precision: "city" } };
  if (typeof value !== "object" || Array.isArray(value)) {
    return { error: "location must be an object" };
  }
  const raw = value as Record<string, unknown>;
  if (!LOCATION_PRECISIONS.includes(raw.precision as CustomerIntakeLocation["precision"])) {
    return { error: "location.precision is invalid" };
  }
  const location: CustomerIntakeLocation = {
    precision: raw.precision as CustomerIntakeLocation["precision"],
  };
  if (typeof raw.label === "string") location.label = raw.label;
  if (typeof raw.lat === "number" && Number.isFinite(raw.lat)) location.lat = raw.lat;
  if (typeof raw.lng === "number" && Number.isFinite(raw.lng)) location.lng = raw.lng;
  return { location };
}

export function parseQuestions(value: unknown): { questions: string[] } | { error: string } {
  if (value == null) return { questions: [] };
  if (!Array.isArray(value)) return { error: "questions must be an array of strings" };
  if (value.length > MAX_QUESTIONS) return { error: "too many questions" };
  const questions: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return { error: "questions must be an array of strings" };
    const trimmed = item.trim();
    if (!trimmed) return { error: "questions entries must be non-empty strings" };
    if (trimmed.length > MAX_QUESTION_LENGTH) return { error: "question is too long" };
    questions.push(trimmed);
  }
  return { questions };
}

export function parseMediaRefs(value: unknown): { media_refs: CustomerIntakeMediaRef[] } | { error: string } {
  if (value == null) return { media_refs: [] };
  if (!Array.isArray(value)) return { error: "media_refs must be an array" };
  if (value.length > MAX_MEDIA_REFS) return { error: "too many media_refs" };
  const media_refs: CustomerIntakeMediaRef[] = [];
  for (const item of value) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
      return { error: "media_refs entries must be objects" };
    }
    const raw = item as Record<string, unknown>;
    for (const key of Object.keys(raw)) {
      if (!MEDIA_KEYS.has(key)) return { error: "media_refs entry has unsupported fields" };
    }
    if (!MEDIA_KINDS.includes(raw.kind as CustomerIntakeMediaRef["kind"])) {
      return { error: "media_refs.kind is invalid" };
    }
    const ref: CustomerIntakeMediaRef = { kind: raw.kind as CustomerIntakeMediaRef["kind"] };
    if (Object.prototype.hasOwnProperty.call(raw, "media_id")) {
      if (typeof raw.media_id !== "string" || !raw.media_id.trim()) {
        return { error: "media_refs.media_id is invalid" };
      }
      const media_id = raw.media_id.trim();
      if (media_id.length > MAX_MEDIA_ID_LENGTH) return { error: "media_refs.media_id is too long" };
      ref.media_id = media_id;
    }
    if (Object.prototype.hasOwnProperty.call(raw, "url")) {
      if (typeof raw.url !== "string") return { error: "media_refs.url is invalid" };
      const url = raw.url.trim();
      if (url.length > MAX_MEDIA_URL_LENGTH) return { error: "media_refs.url is too long" };
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return { error: "media_refs.url is invalid" };
      }
      if (parsed.protocol !== "https:") return { error: "media_refs.url must be https" };
      ref.url = parsed.toString();
    }
    if (!ref.media_id && !ref.url) return { error: "media_refs requires media_id or url" };
    media_refs.push(ref);
  }
  return { media_refs };
}

export function draftFromStorageRow(row: Record<string, unknown>): CustomerIntakeDraft | null {
  const location = parseLocation(row.location ?? { precision: "city" });
  if ("error" in location) return null;
  const questions = parseQuestions(row.questions ?? []);
  if ("error" in questions) return null;
  const media_refs = parseMediaRefs(row.media_refs ?? []);
  if ("error" in media_refs) return null;
  const status = row.status;
  if (status !== "draft" && status !== "submitted" && status !== "withdrawn") return null;
  return {
    id: String(row.id ?? ""),
    tenant_id: String(row.tenant_id ?? ""),
    project_id: (row.project_id as string | null) ?? null,
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    site_context: (row.site_context as string | null) ?? null,
    location: location.location,
    requested_work_type: (row.requested_work_type as string | null) ?? null,
    budget_range: (row.budget_range as string | null) ?? null,
    desired_start: (row.desired_start as string | null) ?? null,
    desired_end: (row.desired_end as string | null) ?? null,
    media_refs: media_refs.media_refs,
    questions: questions.questions,
    status,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function asDraft(row: Record<string, unknown>): CustomerIntakeDraft | null {
  return draftFromStorageRow(row);
}

function requireNonEmptyString(value: unknown, field: string): { value: string } | { error: string } {
  if (typeof value !== "string") return { error: `${field} required` };
  const trimmed = value.trim();
  if (!trimmed) return { error: `${field} required` };
  return { value: trimmed };
}

export function parseCreateCustomerIntakeInput(
  raw: unknown
): { input: CreateCustomerIntakeInput } | { error: string } {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "Invalid body" };
  }
  const body = raw as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(body, "title")) return { error: "title required" };
  if (!Object.prototype.hasOwnProperty.call(body, "description")) return { error: "description required" };
  const title = requireNonEmptyString(body.title, "title");
  if ("error" in title) return title;
  const description = requireNonEmptyString(body.description, "description");
  if ("error" in description) return description;

  let project_id: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, "project_id")) {
    if (body.project_id === null) {
      project_id = null;
    } else if (typeof body.project_id === "string" && body.project_id.trim()) {
      project_id = body.project_id.trim();
    } else {
      return { error: "project_id must be a string or null" };
    }
  }

  const location = parseLocation(body.location);
  if ("error" in location) return location;
  const questions = parseQuestions(body.questions);
  if ("error" in questions) return questions;
  const media_refs = parseMediaRefs(body.media_refs);
  if ("error" in media_refs) return media_refs;

  return {
    input: {
      title: title.value,
      description: description.value,
      project_id,
      site_context: typeof body.site_context === "string" ? body.site_context : null,
      location: location.location,
      requested_work_type: typeof body.requested_work_type === "string" ? body.requested_work_type : null,
      budget_range: typeof body.budget_range === "string" ? body.budget_range : null,
      desired_start: typeof body.desired_start === "string" ? body.desired_start : null,
      desired_end: typeof body.desired_end === "string" ? body.desired_end : null,
      media_refs: media_refs.media_refs,
      questions: questions.questions,
    },
  };
}

async function assertProjectBelongsToTenant(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string | null | undefined
): Promise<string> {
  if (!projectId) return "";
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) return "Project lookup failed";
  if (!data) return "project_id does not belong to tenant";
  return "";
}

export async function createCustomerIntakeDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  raw: unknown
): Promise<{ data: CustomerIntakeDraft | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  const parsed = parseCreateCustomerIntakeInput(raw);
  if ("error" in parsed) return { data: null, error: parsed.error };
  const input = parsed.input;
  const projectErr = await assertProjectBelongsToTenant(supabase, ctx.tenantId, input.project_id);
  if (projectErr) return { data: null, error: projectErr };

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      project_id: input.project_id ?? null,
      title: input.title,
      description: input.description,
      site_context: input.site_context ?? null,
      location: input.location ?? { precision: "city" },
      requested_work_type: input.requested_work_type ?? null,
      budget_range: input.budget_range ?? null,
      desired_start: input.desired_start ?? null,
      desired_end: input.desired_end ?? null,
      media_refs: input.media_refs ?? [],
      questions: input.questions ?? [],
      status: "draft",
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return { data: null, error: error?.message ?? "Insert failed" };
  const draft = asDraft(data as Record<string, unknown>);
  if (!draft) return { data: null, error: "Stored intake draft is invalid" };
  return { data: draft, error: "" };
}

export async function updateCustomerIntakeDraft(
  supabase: SupabaseClient,
  ctx: TenantContext,
  draftId: string,
  raw: unknown
): Promise<{ data: CustomerIntakeDraft | null; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: null, error: "Tenant required" };
  if (!draftId) return { data: null, error: "id required" };
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { data: null, error: "Invalid body" };
  }
  const body = raw as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(body, "tenant_id")) {
    return { data: null, error: "tenant_id is immutable" };
  }
  if (Object.prototype.hasOwnProperty.call(body, "created_by")) {
    return { data: null, error: "created_by is immutable" };
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = requireNonEmptyString(body.title, "title");
    if ("error" in title) return { data: null, error: title.error };
    patch.title = title.value;
  }
  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    const description = requireNonEmptyString(body.description, "description");
    if ("error" in description) return { data: null, error: description.error };
    patch.description = description.value;
  }
  if (Object.prototype.hasOwnProperty.call(body, "project_id")) {
    if (body.project_id === null) {
      patch.project_id = null;
    } else if (typeof body.project_id === "string" && body.project_id.trim()) {
      const projectErr = await assertProjectBelongsToTenant(supabase, ctx.tenantId, body.project_id.trim());
      if (projectErr) return { data: null, error: projectErr };
      patch.project_id = body.project_id.trim();
    } else {
      return { data: null, error: "project_id must be a string or null" };
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, "questions")) {
    const questions = parseQuestions(body.questions);
    if ("error" in questions) return { data: null, error: questions.error };
    patch.questions = questions.questions;
  }
  if (Object.prototype.hasOwnProperty.call(body, "media_refs")) {
    const media_refs = parseMediaRefs(body.media_refs);
    if ("error" in media_refs) return { data: null, error: media_refs.error };
    patch.media_refs = media_refs.media_refs;
  }
  if (Object.prototype.hasOwnProperty.call(body, "location")) {
    const location = parseLocation(body.location);
    if ("error" in location) return { data: null, error: location.error };
    patch.location = location.location;
  }

  const { data, error } = await supabase
    .from("customer_intake_drafts")
    .update(patch)
    .eq("id", draftId)
    .eq("tenant_id", ctx.tenantId)
    .eq("created_by", ctx.userId)
    .select("*")
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: "Update denied" };
  const draft = asDraft(data as Record<string, unknown>);
  if (!draft) return { data: null, error: "Stored intake draft is invalid" };
  return { data: draft, error: "" };
}

export async function listCustomerIntakeDrafts(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<{ data: CustomerIntakeDraft[]; error: string }> {
  if (!ctx.tenantId || !ctx.userId) return { data: [], error: "Tenant required" };
  const query = supabase
    .from("customer_intake_drafts")
    .select("*")
    .eq("tenant_id", ctx.tenantId);
  const scoped =
    ctx.role === "stakeholder" ? query.eq("created_by", ctx.userId) : query;
  const { data, error } = await scoped.order("created_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  const drafts: CustomerIntakeDraft[] = [];
  for (const row of data ?? []) {
    const draft = asDraft(row as Record<string, unknown>);
    if (draft) drafts.push(draft);
  }
  return { data: drafts, error: "" };
}
