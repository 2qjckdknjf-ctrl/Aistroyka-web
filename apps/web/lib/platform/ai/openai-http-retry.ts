/**
 * Resilient fetch to OpenAI APIs: bounded retries on transient HTTP statuses.
 * Each attempt uses a fresh AbortSignal and `timeoutMs` ceiling (timer cleared before backoff).
 */

const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/** Combine abort reasons (e.g. client disconnect + per-attempt timeout). */
export function mergeAbortSignals(outer: AbortSignal, inner: AbortSignal): AbortSignal {
  const anyFn = (
    AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }
  ).any;
  if (typeof anyFn === "function") {
    return anyFn([outer, inner]);
  }
  const c = new AbortController();
  const onAbort = () => c.abort();
  if (outer.aborted || inner.aborted) {
    c.abort();
    return c.signal;
  }
  outer.addEventListener("abort", onAbort);
  inner.addEventListener("abort", onAbort);
  return c.signal;
}

export function isTransientOpenAiHttpStatus(status: number): boolean {
  return TRANSIENT_STATUSES.has(status);
}

function backoffMs(attempt: number, response: Response): number {
  const raw = response.headers.get("retry-after");
  if (raw) {
    const sec = Number.parseFloat(raw);
    if (Number.isFinite(sec) && sec > 0) {
      return Math.min(15_000, Math.round(sec * 1000));
    }
  }
  const base = 400 * 2 ** attempt;
  return Math.min(10_000, base + Math.floor(Math.random() * 250));
}

export interface FetchWithOpenAiRetryOptions {
  /** Extra attempts after the first (e.g. 2 → up to 3 HTTP calls). */
  maxRetries: number;
  /** Hard cap per HTTP attempt (abort triggers retry if transient). */
  timeoutMs: number;
  /** When aborted, fetch errors are not retried (e.g. user cancelled the SSE request). */
  outerSignal?: AbortSignal | null;
}

/**
 * @param getInit — builder so each attempt gets a new `AbortSignal` bound to that attempt's timer.
 */
export async function fetchWithOpenAiRetry(
  url: string,
  getInit: (signal: AbortSignal) => RequestInit,
  options: FetchWithOpenAiRetryOptions
): Promise<Response> {
  let last: Response | undefined;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    if (options.outerSignal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), options.timeoutMs);
    try {
      const innerSignal = options.outerSignal
        ? mergeAbortSignals(options.outerSignal, ac.signal)
        : ac.signal;
      last = await fetch(url, getInit(innerSignal));
    } catch (err) {
      last = undefined;
      if (options.outerSignal?.aborted) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      if (attempt === options.maxRetries) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      const synthetic = new Response("", { status: 503 });
      await new Promise((r) => setTimeout(r, backoffMs(attempt, synthetic)));
      continue;
    } finally {
      clearTimeout(tid);
    }

    if (last.ok) return last;
    if (!isTransientOpenAiHttpStatus(last.status) || attempt === options.maxRetries) {
      return last;
    }
    await new Promise((r) => setTimeout(r, backoffMs(attempt, last)));
  }

  return last!;
}
