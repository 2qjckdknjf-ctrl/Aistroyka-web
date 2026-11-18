import { describe, expect, it, vi } from "vitest";
import {
  archiveCopilotThread,
  createCopilotThread,
  getCopilotThread,
  listCopilotThreads,
} from "./chat-history.service";

const thread = {
  id: "th1",
  project_id: "p1",
  title: null,
  created_at: "2026-09-06T10:00:00Z",
  updated_at: "2026-09-06T10:01:00Z",
  last_message_at: null,
  status: "active",
};

describe("copilot chat history service", () => {
  it("lists only the caller's active threads in the requested tenant/project", async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [thread], error: null }),
    };
    const supabase = { from: vi.fn(() => query) } as never;

    const result = await listCopilotThreads(supabase, "t1", "u1", "p1", 999);

    expect(result).toEqual({ data: [thread], error: "" });
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "t1");
    expect(query.eq).toHaveBeenCalledWith("project_id", "p1");
    expect(query.eq).toHaveBeenCalledWith("created_by", "u1");
    expect(query.eq).toHaveBeenCalledWith("status", "active");
    expect(query.limit).toHaveBeenCalledWith(50);
  });

  it("loads the newest message window and restores chronological order without selecting drifted low_confidence", async () => {
    const threadQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: thread, error: null }),
    };
    const messageRows = [
      {
        id: "m2",
        thread_id: "th1",
        role: "assistant",
        content: "two",
        request_id: "r2",
        error_kind: null,
        created_at: "2026-09-06T10:02:00Z",
      },
      {
        id: "m1",
        thread_id: "th1",
        role: "user",
        content: "one",
        request_id: "r1",
        error_kind: null,
        created_at: "2026-09-06T10:01:00Z",
      },
    ];
    const messageQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: messageRows, error: null }),
    };
    const supabase = {
      from: vi.fn((table: string) => (table === "ai_chat_threads" ? threadQuery : messageQuery)),
    } as never;

    const result = await getCopilotThread(supabase, "t1", "u1", "p1", "th1", 500);

    expect(result.error).toBe("");
    expect(result.data?.messages.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(result.data?.messages.every((m) => m.low_confidence === false)).toBe(true);
    expect(messageQuery.select).toHaveBeenCalledWith(
      "id, thread_id, role, content, request_id, error_kind, created_at"
    );
    expect(messageQuery.limit).toHaveBeenCalledWith(200);
  });

  it("creates an active thread bound to tenant, project and caller", async () => {
    let inserted: Record<string, unknown> | null = null;
    const query = {
      insert: vi.fn((row: Record<string, unknown>) => {
        inserted = row;
        return query;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: thread, error: null }),
    };
    const supabase = { from: vi.fn(() => query) } as never;

    const result = await createCopilotThread(supabase, "t1", "u1", "p1", "  Site chat  ");

    expect(result.error).toBe("");
    expect(inserted).toEqual({
      tenant_id: "t1",
      project_id: "p1",
      created_by: "u1",
      title: "Site chat",
      status: "active",
    });
  });

  it("archives the caller's thread instead of deleting it", async () => {
    const query = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "th1" }, error: null }),
    };
    const supabase = { from: vi.fn(() => query) } as never;

    const result = await archiveCopilotThread(supabase, "t1", "u1", "p1", "th1");

    expect(result).toEqual({ ok: true, error: "" });
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "archived", updated_at: expect.any(String) })
    );
    expect(query.eq).toHaveBeenCalledWith("tenant_id", "t1");
    expect(query.eq).toHaveBeenCalledWith("project_id", "p1");
    expect(query.eq).toHaveBeenCalledWith("created_by", "u1");
  });
});
