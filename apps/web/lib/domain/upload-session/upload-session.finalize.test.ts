import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { finalize } from "./upload-session.repository";

let current: { id: string; user_id: string; status: string; expires_at: string; object_path: string | null; mime_type: string | null; size_bytes: number | null } | null;
let writeResult: { data: { id: string } | null; error: unknown };
let writes: number;
let filters: Array<[string, unknown]>;
let reads: number;
let committed: typeof current | undefined;
const payload = { object_path: "media/t1/s1/image.png", mime_type: "image/png", size_bytes: 10 };
const client = {
  from: () => ({
    select: () => {
      const query = { eq: () => query, maybeSingle: async () => ({ data: ++reads > 1 && committed !== undefined ? committed : current, error: null }) };
      return query;
    },
    update: () => {
      writes++;
      const query = { eq: (key: string, value: unknown) => { filters.push([key, value]); return query; }, in: (key: string, value: string[]) => { filters.push([key, value]); return query; }, gt: (key: string, value: string) => { filters.push([key, value]); return query; }, select: () => query, maybeSingle: async () => writeResult };
      return query;
    },
  }),
} as unknown as SupabaseClient;
beforeEach(() => { vi.clearAllMocks(); current = { id: "s1", user_id: "u1", status: "created", expires_at: new Date(Date.now() + 3600000).toISOString(), object_path: null, mime_type: null, size_bytes: null }; writeResult = { data: { id: "s1" }, error: null }; writes = 0; filters = []; reads = 0; committed = undefined; });
describe("upload finalization CAS result", () => {
  it("does not report success after a zero-row write", async () => {
    writeResult.data = null;
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(false);
  });
  it("accepts only an actual own unexpired source transition", async () => {
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(true);
    expect(filters).toContainEqual(["user_id", "u1"]);
    expect(filters).toContainEqual(["status", ["created", "uploaded"]]);
    expect(filters.some(([key]) => key === "expires_at")).toBe(true);
  });
  it("accepts the exact source after an identical concurrent request wins", async () => {
    writeResult.data = null; committed = { ...current!, status: "finalized", ...payload };
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(true); expect(reads).toBe(2);
  });
  it("rejects a different source after losing the CAS", async () => {
    writeResult.data = null; committed = { ...current!, status: "finalized", object_path: "media/t1/s1/other.png" };
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(false);
  });
  it("rejects a disappearing session after losing the CAS", async () => {
    writeResult.data = null; committed = null;
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(false);
  });
  it("keeps same-source finalized retries idempotent without writing", async () => {
    current!.status = "finalized"; Object.assign(current!, payload);
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(true); expect(writes).toBe(0);
  });
  it("rejects a different original after finalization", async () => {
    current!.status = "finalized"; current!.object_path = "media/t1/s1/approved.png";
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(false); expect(writes).toBe(0);
  });
  it("denies another user's session without a write", async () => {
    current!.user_id = "other";
    expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(false); expect(writes).toBe(0);
  });
  for (const patch of [{ mime_type: "image/jpeg" }, { size_bytes: 99 }]) {
    it("does not accept a losing finalize with different immutable metadata " + JSON.stringify(patch), async () => {
      writeResult.data = null; committed = { ...current!, status: "finalized", ...payload, ...patch };
      expect(await finalize(client, "s1", "t1", "u1", payload)).toBe(false);
    });
  }
});
