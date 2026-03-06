import { describe, expect, it } from "vitest";
import { syncConflictResponse } from "./sync-conflict";

describe("syncConflictResponse", () => {
  it("returns 409 with deterministic body", async () => {
    const res = syncConflictResponse(100);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({
      error: "conflict",
      code: "sync_conflict",
      serverCursor: 100,
      must_bootstrap: true,
      hint: "Call bootstrap, reset cursor to serverCursor, then retry changes/ack.",
    });
  });

  it("omits hint when must_bootstrap is false", async () => {
    const res = syncConflictResponse(50, false);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.serverCursor).toBe(50);
    expect(body.must_bootstrap).toBe(false);
    expect(body.hint).toBeUndefined();
  });

  it("uses custom hint when provided", async () => {
    const res = syncConflictResponse(80, true, "retention_window_exceeded");
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.hint).toBe("retention_window_exceeded");
    expect(body.must_bootstrap).toBe(true);
  });
});
