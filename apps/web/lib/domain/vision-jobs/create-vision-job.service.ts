import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnalysisJob } from "@/lib/api/engine";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  mapAnalysisJobToLifecycle,
  type VisionJobLifecycle,
} from "@/lib/domain/vision-jobs/vision-job-lifecycle";

export type CreateVisionAnalysisJobInput = {
  tenantId: string;
  projectId: string;
  mediaId: string;
  requestKey?: string | null;
  priority?: "high" | "normal" | "low";
};

export type CreateVisionAnalysisJobResult =
  | {
      ok: true;
      created: boolean;
      jobId: string;
      lifecycle: VisionJobLifecycle;
      status: string;
    }
  | { ok: false; error: string; status: 400 | 403 | 404 | 409 | 503 };

function asJob(row: Record<string, unknown> | null): {
  id: string;
  status: string;
  error_type: string | null;
  attempts: number | null;
} | null {
  if (!row?.id) return null;
  return {
    id: String(row.id),
    status: String(row.status ?? "queued"),
    error_type: (row.error_type as string | null) ?? null,
    attempts: typeof row.attempts === "number" ? row.attempts : null,
  };
}

function successFromJob(
  row: Record<string, unknown>,
  created: boolean
): Extract<CreateVisionAnalysisJobResult, { ok: true }> | { ok: false; error: string; status: 404 } {
  const job = asJob(row);
  if (!job) return { ok: false, error: "Job not found", status: 404 };
  return {
    ok: true,
    created,
    jobId: job.id,
    status: job.status,
    lifecycle: mapAnalysisJobToLifecycle(job),
  };
}

function isUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  const message = error.message ?? "";
  return /duplicate key|unique constraint|already exists/i.test(message);
}

const ADMIN_REQUIRED =
  "create_analysis_job requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy.";

type PersistRequestKeyResult =
  | { kind: "attached" }
  | { kind: "already_set" }
  | { kind: "reuse"; result: Extract<CreateVisionAnalysisJobResult, { ok: true }> }
  | { kind: "error"; result: Extract<CreateVisionAnalysisJobResult, { ok: false }> };

async function reuseByRequestKey(
  admin: SupabaseClient,
  input: { tenantId: string; mediaId: string; requestKey: string }
): Promise<PersistRequestKeyResult> {
  const { data: existing, error: existingErr } = await admin
    .from("analysis_jobs")
    .select("id, status, error_type, attempts, media_id")
    .eq("tenant_id", input.tenantId)
    .eq("request_key", input.requestKey)
    .maybeSingle();
  if (existingErr) {
    return { kind: "error", result: { ok: false, error: existingErr.message, status: 503 } };
  }
  if (!existing?.id) {
    return { kind: "error", result: { ok: false, error: "Idempotency key already used", status: 409 } };
  }
  if (existing.media_id !== input.mediaId) {
    return { kind: "error", result: { ok: false, error: "Idempotency key already used", status: 409 } };
  }
  const reused = successFromJob(existing as Record<string, unknown>, false);
  if (!reused.ok) return { kind: "error", result: reused };
  return { kind: "reuse", result: reused };
}

async function persistRequestKey(
  admin: SupabaseClient,
  input: {
    tenantId: string;
    mediaId: string;
    jobId: string;
    requestKey: string;
    providerMetadata?: { source: "vision_async" };
  }
): Promise<PersistRequestKeyResult> {
  const patch: { request_key: string; provider_metadata?: { source: "vision_async" } } = {
    request_key: input.requestKey,
  };
  if (input.providerMetadata) patch.provider_metadata = input.providerMetadata;

  const { data, error } = await admin
    .from("analysis_jobs")
    .update(patch)
    .eq("id", input.jobId)
    .eq("tenant_id", input.tenantId)
    .is("request_key", null)
    .select("id")
    .maybeSingle();

  if (isUniqueViolation(error)) {
    return reuseByRequestKey(admin, input);
  }
  if (error) {
    return { kind: "error", result: { ok: false, error: error.message, status: 503 } };
  }
  if (data?.id) return { kind: "attached" };

  const { data: current, error: currentErr } = await admin
    .from("analysis_jobs")
    .select("id, request_key")
    .eq("id", input.jobId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (currentErr) {
    return { kind: "error", result: { ok: false, error: currentErr.message, status: 503 } };
  }
  if (current?.request_key === input.requestKey) return { kind: "already_set" };
  // Another caller already keyed this row; do not treat a leftover null as success.
  if (current?.request_key) return { kind: "already_set" };
  return { kind: "error", result: { ok: false, error: "Failed to persist idempotency key", status: 503 } };
}

export async function createVisionAnalysisJob(
  supabase: SupabaseClient,
  input: CreateVisionAnalysisJobInput
): Promise<CreateVisionAnalysisJobResult> {
  const { data: media, error: mediaErr } = await supabase
    .from("media")
    .select("id, tenant_id, project_id")
    .eq("id", input.mediaId)
    .maybeSingle();
  if (mediaErr) return { ok: false, error: mediaErr.message, status: 503 };
  if (!media) return { ok: false, error: "Media not found", status: 404 };
  if (media.tenant_id !== input.tenantId || media.project_id !== input.projectId) {
    return { ok: false, error: "Media not found", status: 404 };
  }

  const requestKey = input.requestKey?.trim() || null;
  if (requestKey) {
    const { data: existing, error: existingErr } = await supabase
      .from("analysis_jobs")
      .select("id, status, error_type, attempts, media_id")
      .eq("tenant_id", input.tenantId)
      .eq("request_key", requestKey)
      .maybeSingle();
    if (existingErr) return { ok: false, error: existingErr.message, status: 503 };
    if (existing?.id) {
      if (existing.media_id !== input.mediaId) {
        return { ok: false, error: "Idempotency key already used", status: 409 };
      }
      return successFromJob(existing as Record<string, unknown>, false);
    }
  }

  const { data: active } = await supabase
    .from("analysis_jobs")
    .select("id, status, error_type, attempts")
    .eq("media_id", input.mediaId)
    .in("status", ["pending", "queued", "processing"])
    .maybeSingle();
  if (active?.id) {
    if (requestKey) {
      const admin = getAdminClient();
      if (!admin) return { ok: false, error: ADMIN_REQUIRED, status: 503 };
      const persisted = await persistRequestKey(admin, {
        tenantId: input.tenantId,
        mediaId: input.mediaId,
        jobId: String(active.id),
        requestKey,
      });
      if (persisted.kind === "reuse") return persisted.result;
      if (persisted.kind === "error") return persisted.result;
    }
    return successFromJob(active as Record<string, unknown>, false);
  }

  try {
    const created = await createAnalysisJob(supabase, {
      tenant_id: input.tenantId,
      media_id: input.mediaId,
      priority: input.priority ?? "normal",
    });
    if (requestKey) {
      const admin = getAdminClient();
      if (!admin) return { ok: false, error: ADMIN_REQUIRED, status: 503 };
      const persisted = await persistRequestKey(admin, {
        tenantId: input.tenantId,
        mediaId: input.mediaId,
        jobId: created.id,
        requestKey,
        providerMetadata: { source: "vision_async" },
      });
      if (persisted.kind === "reuse") return persisted.result;
      if (persisted.kind === "error") return persisted.result;
    }
    return {
      ok: true,
      created: true,
      jobId: created.id,
      status: created.status ?? "queued",
      lifecycle: mapAnalysisJobToLifecycle({ status: created.status ?? "queued" }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create analysis job";
    const code =
      typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
    if (requestKey && (code === "23505" || isUniqueViolation({ code, message }))) {
      const admin = getAdminClient();
      if (admin) {
        const reused = await reuseByRequestKey(admin, {
          tenantId: input.tenantId,
          mediaId: input.mediaId,
          requestKey,
        });
        if (reused.kind === "reuse") return reused.result;
        if (reused.kind === "error" && reused.result.status !== 409) return reused.result;
      }
      const { data: raced } = await supabase
        .from("analysis_jobs")
        .select("id, status, error_type, attempts")
        .eq("media_id", input.mediaId)
        .in("status", ["pending", "queued", "processing"])
        .maybeSingle();
      if (raced?.id) return successFromJob(raced as Record<string, unknown>, false);
    }
    return { ok: false, error: message, status: 503 };
  }
}
