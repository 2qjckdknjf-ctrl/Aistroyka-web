export type VisionJobLifecycle =
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED_RETRYABLE"
  | "FAILED_FINAL";

export type AnalysisJobStatus = "pending" | "queued" | "processing" | "completed" | "failed";

const RETRYABLE_ERROR_TYPES = new Set([
  "timeout",
  "provider_timeout",
  "provider_unavailable",
  "network",
]);

export const VISION_MAX_ATTEMPTS = 3;

export class VisionProviderError extends Error {
  readonly httpStatus: number | null;
  readonly errorType: string;
  readonly retryable: boolean;

  constructor(args: {
    message: string;
    httpStatus?: number | null;
    errorType: string;
    retryable: boolean;
  }) {
    super(args.message);
    this.name = "VisionProviderError";
    this.httpStatus = args.httpStatus ?? null;
    this.errorType = args.errorType;
    this.retryable = args.retryable;
  }
}

export function classifyProviderHttpStatus(status: number): { errorType: string; retryable: boolean } {
  if (status === 429) return { errorType: "provider_unavailable", retryable: true };
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return { errorType: "invalid_request", retryable: false };
  }
  if (status >= 500 && status <= 599) return { errorType: "provider_unavailable", retryable: true };
  if (status >= 400 && status <= 499) return { errorType: "invalid_request", retryable: false };
  return { errorType: "ai_failure", retryable: true };
}

export function mapAnalysisJobToLifecycle(input: {
  status: string | null;
  error_type?: string | null;
  attempts?: number | null;
}): VisionJobLifecycle {
  const status = (input.status ?? "").toLowerCase();
  switch (status) {
    case "pending":
    case "queued":
      return "QUEUED";
    case "processing":
      return "PROCESSING";
    case "completed":
      return "SUCCEEDED";
    case "failed": {
      const attempts = typeof input.attempts === "number" && Number.isFinite(input.attempts) ? input.attempts : 0;
      const retryableType = input.error_type ? RETRYABLE_ERROR_TYPES.has(input.error_type) : false;
      if (retryableType && attempts < VISION_MAX_ATTEMPTS) return "FAILED_RETRYABLE";
      return "FAILED_FINAL";
    }
    default:
      return "FAILED_FINAL";
  }
}

export function classifyVisionFailure(
  input: string | { message: string; httpStatus?: number | null }
): { errorType: string; retryable: boolean } {
  if (typeof input !== "string" && typeof input.httpStatus === "number") {
    return classifyProviderHttpStatus(input.httpStatus);
  }
  const message = typeof input === "string" ? input : input.message;
  const lower = message.toLowerCase();
  if (lower.includes("timeout") || lower.includes("abort")) {
    return { errorType: "timeout", retryable: true };
  }
  if (
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("econnreset")
  ) {
    return { errorType: "provider_unavailable", retryable: true };
  }
  if (lower.includes("not implemented")) {
    return { errorType: "validation_error", retryable: false };
  }
  return { errorType: "ai_failure", retryable: false };
}

export function mapPollStatusJobs(
  jobs: Array<{
    id: string;
    status: string | null;
    error_type?: string | null;
    attempt_count?: number | null;
    started_at?: string | null;
  }>,
  nowMs: number,
  processingTimeoutMs: number
): { hasActiveJobs: boolean; jobs: Array<{ jobId: string; status: string | null; lifecycle: VisionJobLifecycle }> } {
  const mapped = jobs.map((j) => ({
    jobId: j.id,
    status: j.status,
    lifecycle: mapAnalysisJobToLifecycle({
      status: j.status,
      error_type: j.error_type ?? null,
      attempts: j.attempt_count ?? 0,
    }),
  }));
  const hasActiveJobs = jobs.some((j) => {
    const s = j.status;
    if (s !== "pending" && s !== "queued" && s !== "processing") return false;
    if (s === "processing") {
      const started = j.started_at ? new Date(j.started_at).getTime() : Number.NaN;
      if (!Number.isFinite(started) || nowMs - started > processingTimeoutMs) return false;
    }
    return true;
  });
  return { hasActiveJobs, jobs: mapped };
}
