import { describe, expect, it, vi } from "vitest";
import {
  decodeMessageCursor,
  encodeMessageCursor,
  listByTask,
} from "./task-messages.repository";

describe("task-messages.repository cursor", () => {
  it("round-trips created_at with timezone offset", () => {
    const createdAt = "2026-07-18T10:00:00+00:00";
    const id = "11111111-2222-3333-4444-555555555555";
    const cursor = encodeMessageCursor(createdAt, id);
    const decoded = decodeMessageCursor(cursor);
    expect(decoded).toEqual({ createdAt, id });
  });

  it("returns null for malformed cursor", () => {
    expect(decodeMessageCursor("not-valid")).toBeNull();
    expect(decodeMessageCursor("")).toBeNull();
  });
});

describe("task-messages.repository listByTask errors", () => {
  it("surfaces query errors instead of an empty success page", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "connection reset" },
    });
    const order2 = vi.fn().mockReturnValue({ limit });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const is = vi.fn().mockReturnValue({ order: order1 });
    const eqTask = vi.fn().mockReturnValue({ is });
    const eqTenant = vi.fn().mockReturnValue({ eq: eqTask });
    const select = vi.fn().mockReturnValue({ eq: eqTenant });
    const supabase = { from: vi.fn().mockReturnValue({ select }) } as any;

    const res = await listByTask(supabase, "t1", "task-1", { limit: 50 });
    expect(res.error).toBe("connection reset");
    expect(res.data).toEqual([]);
    expect(res.nextCursor).toBeNull();
  });

  it("returns empty data without error when thread is empty", async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order2 = vi.fn().mockReturnValue({ limit });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const is = vi.fn().mockReturnValue({ order: order1 });
    const eqTask = vi.fn().mockReturnValue({ is });
    const eqTenant = vi.fn().mockReturnValue({ eq: eqTask });
    const select = vi.fn().mockReturnValue({ eq: eqTenant });
    const supabase = { from: vi.fn().mockReturnValue({ select }) } as any;

    const res = await listByTask(supabase, "t1", "task-1", { limit: 50 });
    expect(res.error).toBeUndefined();
    expect(res.data).toEqual([]);
    expect(res.nextCursor).toBeNull();
  });
});
