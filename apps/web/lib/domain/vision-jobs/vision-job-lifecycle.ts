export type VisionJobLifecycle =
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED_RETRYABLE"
  | "FAILED_FINAL";

export type AnalysisJobStatus = "pending" | "queued" | "processing" | "completed" | "failed";

const RETRYABLE_ERROR_TYPES = new Set([
  "timeout",
  "ai_failure",
  "provider_timeout",
  "provider_unavailable",
  "network",
]);

export const VISION_MAX_ATTEMPTS = 3;

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
      const attempts = input.attempts ?? 1;
      const retryableType = input.error_type
        ? RETRYABLE_ERROR_TYPES.has(input.error_type)
        : false;
      if (retryableType && attempts < VISION_MAX_ATTEMPTS) return "FAILED_RETRYABLE";
      return "FAILED_FINAL";
    }
    default:
      return "FAILED_FINAL";
  }
}

export function classifyVisionFailure(message: string): {
  errorType: string;
  retryable: boolean;
} {
  const lower = message.toLowerCase();
  if (lower.includes("timeout") || lower.includes("abort")) {
    return { errorType: "timeout", retryable: true };
  }
  if (
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("429")
  ) {
    return { errorType: "provider_unavailable", retryable: true };
  }
  if (lower.includes("not implemented")) {
    return { errorType: "validation_error", retryable: false };
  }
  return { errorType: "ai_failure", retryable: true };
}
