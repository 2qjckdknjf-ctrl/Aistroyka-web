import { vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Network calls are forbidden in unit tests. Mock fetch.");
    }) as typeof fetch
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
