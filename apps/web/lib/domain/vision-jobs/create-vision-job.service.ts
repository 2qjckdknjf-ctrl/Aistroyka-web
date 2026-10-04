import type { SupabaseClient } from "@supabase/supabase-js";
import { createAnalysisJob } from "@/lib/api/engine";
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
  const attemptCount =
    typeof row.attempt_count === "number"
      ? row.attempt_count
      : typeof row.attempts === "number"
        ? row.attempts
        : null;
  return {
    id: String(row.id),
    status: String(row.status ?? "queued"),
    error_type: (row.error_type as string | null) ?? null,
    attempts: attemptCount,
  };
}

export function visionJobCreateFailure(err: unknown): { message: string; conflict: boolean } {
  const code =
    err && typeof err === "object" && "code" in err && typeof err.code === "string" ? err.code : "";
  const message =
    err instanceof Error
      ? err.message
      : err && typeof err === "object" && "message" in err && typeof err.message === "string"
        ? err.message
        : "Failed to create analysis job";
  const conflict = code === "23505" || /23505|Idempotency key already used/i.test(message);
  return { message, conflict };
}

export async function createVisionAnalysisJob(
  supabase: SupabaseClient,
  input: CreateVisionAnalysisJobInput
): Promise<CreateVisionAnalysisJobResult> {
  if (input.requestKey != null && typeof input.requestKey !== "string") {
    return { ok: false, error: "request_key must be a string", status: 400 };
  }
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
      .select("id, status, error_type, attempt_count, media_id")
      .eq("tenant_id", input.tenantId)
      .eq("request_key", requestKey)
      .maybeSingle();
    if (existingErr) return { ok: false, error: existingErr.message, status: 503 };
    if (existing?.id) {
      if (existing.media_id !== input.mediaId) {
        return { ok: false, error: "Idempotency key already used", status: 409 };
      }
      const job = asJob(existing as Record<string, unknown>);
      if (!job) return { ok: false, error: "Job not found", status: 404 };
      return {
        ok: true,
        created: false,
        jobId: job.id,
        status: job.status,
        lifecycle: mapAnalysisJobToLifecycle(job),
      };
    }
  }

  const { data: active } = await supabase
    .from("analysis_jobs")
    .select("id, status, error_type, attempt_count")
    .eq("media_id", input.mediaId)
    .in("status", ["pending", "queued", "processing"])
    .maybeSingle();
  if (active?.id) {
    const job = asJob(active as Record<string, unknown>);
    if (job) {
      if (requestKey) {
        try {
          const bound = await createAnalysisJob(supabase, {
            tenant_id: input.tenantId,
            media_id: input.mediaId,
            priority: input.priority ?? "normal",
            request_key: requestKey,
          });
          const created = bound.id !== job.id;
          return {
            ok: true,
            created,
            jobId: bound.id,
            status: bound.status ?? (created ? "queued" : job.status),
            lifecycle: mapAnalysisJobToLifecycle(
              created
                ? { status: bound.status ?? "queued" }
                : {
                    status: bound.status ?? job.status,
                    error_type: job.error_type,
                    attempts: job.attempts,
                  }
            ),
          };
        } catch (err) {
          const failure = visionJobCreateFailure(err);
          if (failure.conflict) {
            return { ok: false, error: "Idempotency key already used", status: 409 };
          }
          return { ok: false, error: failure.message, status: 503 };
        }
      }
      return {
        ok: true,
        created: false,
        jobId: job.id,
        status: job.status,
        lifecycle: mapAnalysisJobToLifecycle(job),
      };
    }
  }

  try {
    const created = await createAnalysisJob(supabase, {
      tenant_id: input.tenantId,
      media_id: input.mediaId,
      priority: input.priority ?? "normal",
      request_key: requestKey,
    });
    return {
      ok: true,
      created: true,
      jobId: created.id,
      status: created.status ?? "queued",
      lifecycle: mapAnalysisJobToLifecycle({ status: created.status ?? "queued" }),
    };
  } catch (err) {
    const failure = visionJobCreateFailure(err);
    if (failure.conflict) {
      return { ok: false, error: "Idempotency key already used", status: 409 };
    }
    return { ok: false, error: failure.message, status: 503 };
  }
}
