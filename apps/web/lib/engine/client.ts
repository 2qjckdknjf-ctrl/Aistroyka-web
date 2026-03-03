/**
 * Base fetch client for AI/engine (Copilot Edge).
 * - Always generates requestId before request; sends as X-Request-Id.
 * - Authoritative request_id: header X-Request-Id > body.request_id > generated (for backend log correlation).
 * - Adds Authorization when provided; supports AbortController; 8s timeout.
 * - Handles JSON and non-JSON responses.
 */

const DEFAULT_TIMEOUT_MS = 8000;

export interface EngineClientOptions {
  /** Optional: get Bearer token (e.g. from Supabase session) */
  getAuthToken?: () => Promise<string | null>;
  /** Optional: existing request_id for correlation (still sent; authoritative comes from response) */
  requestId?: string | null;
  /** Optional: abort signal */
  signal?: AbortSignal | null;
  /** Optional: timeout in ms (default 8s) */
  timeoutMs?: number;
}

export interface EngineFetchResult {
  ok: boolean;
  status: number;
  /** Authoritative request_id: response header > body.request_id > sent requestId */
  request_id: string;
  data: unknown;
  headers: Headers;
}

export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Exported for tests: header > body.request_id > sentRequestId */
export function getAuthoritativeRequestId(
  responseHeaders: Headers,
  body: Record<string, unknown> | null,
  sentRequestId: string
): string {
  const fromHeader = responseHeaders.get("X-Request-Id")?.trim();
  if (fromHeader) return fromHeader;
  const fromBody = body?.request_id != null ? String(body.request_id).trim() : "";
  if (fromBody) return fromBody;
  return sentRequestId;
}

/** Request init with body allowed as object (will be JSON.stringified). */
export type EngineFetchInit = Omit<RequestInit, "body"> & { body?: string | Record<string, unknown> | null };

export async function engineFetch(
  url: string,
  init: EngineFetchInit,
  options: EngineClientOptions = {}
): Promise<EngineFetchResult> {
  const sentRequestId = options.requestId?.trim() || generateRequestId();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortHandler = () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
  if (options.signal) {
    options.signal.addEventListener("abort", abortHandler);
  }
  const signal = controller.signal;

  const headers = new Headers(init.headers as HeadersInit);
  headers.set("Content-Type", "application/json");
  headers.set("X-Request-Id", sentRequestId);

  if (options.getAuthToken) {
    try {
      const token = await options.getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    } catch {
      // proceed without auth
    }
  }

  let body: string | undefined;
  if (init.body != null) {
    body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
  }

  try {
    const res = await fetch(url, {
      ...init,
      method: init.method ?? "POST",
      headers,
      body,
      signal,
    });
    clearTimeout(timeoutId);

    let data: unknown;
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = { error: await res.text().catch(() => "Invalid JSON") };
      }
    } else {
      data = { error: await res.text().catch(() => "Non-JSON response") };
    }

    const bodyObj = data != null && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const authoritativeRequestId = getAuthoritativeRequestId(res.headers, bodyObj, sentRequestId);

    return {
      ok: res.ok,
      status: res.status,
      request_id: authoritativeRequestId,
      data,
      headers: res.headers,
    };
  } catch (e) {
    clearTimeout(timeoutId);
    const isAbort = e instanceof Error && e.name === "AbortError";
    throw Object.assign(
      new Error(isAbort ? "Request timed out or was cancelled." : String(e)),
      { requestId: sentRequestId, cause: e }
    );
  } finally {
    if (options.signal) options.signal.removeEventListener("abort", abortHandler);
  }
}
