import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchWithOpenAiRetry,
  isTransientOpenAiHttpStatus,
  mergeAbortSignals,
} from "./openai-http-retry";

describe("isTransientOpenAiHttpStatus", () => {
  it("treats 429 and 503 as transient", () => {
    expect(isTransientOpenAiHttpStatus(429)).toBe(true);
    expect(isTransientOpenAiHttpStatus(503)).toBe(true);
    expect(isTransientOpenAiHttpStatus(401)).toBe(false);
  });
});

describe("mergeAbortSignals", () => {
  it("aborts when either source aborts", () => {
    const a = new AbortController();
    const b = new AbortController();
    const m = mergeAbortSignals(a.signal, b.signal);
    expect(m.aborted).toBe(false);
    b.abort();
    expect(m.aborted).toBe(true);
  });
});

describe("fetchWithOpenAiRetry", () => {
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("returns on first 200", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    const res = await fetchWithOpenAiRetry(
      "https://api.openai.com/v1/foo",
      (signal) => ({ signal }),
      { maxRetries: 2, timeoutMs: 30_000 }
    );
    expect(res.ok).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on 503 then succeeds", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response("err", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    globalThis.fetch = f;
    const p = fetchWithOpenAiRetry(
      "https://api.openai.com/v1/foo",
      (signal) => ({ signal }),
      { maxRetries: 2, timeoutMs: 30_000 }
    );
    await vi.advanceTimersByTimeAsync(15_000);
    const res = await p;
    expect(res.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("does not retry when outer signal is aborted", async () => {
    const outer = new AbortController();
    outer.abort();
    globalThis.fetch = vi.fn();
    await expect(
      fetchWithOpenAiRetry(
        "https://api.openai.com/v1/foo",
        (signal) => ({ signal }),
        { maxRetries: 2, timeoutMs: 30_000, outerSignal: outer.signal }
      )
    ).rejects.toThrow();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
