import { describe, it, expect, vi } from "vitest";
import { getProjectTimeline } from "./project-timeline.repository";

function mockChain(resolved: { data: unknown[] }) {
  const promise = Promise.resolve(resolved);
  const c = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue(promise),
    then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      promise.then(onFulfilled, onRejected),
    catch: (cb: (e: unknown) => unknown) => promise.catch(cb),
  };
  return { select: () => c };
}

describe("getProjectTimeline", () => {
  it("returns empty array for project with no events", async () => {
    const empty = { data: [], error: null };
    const supabase = {
      from: vi.fn().mockReturnValue(mockChain(empty)),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    expect(result).toEqual([]);
  });

  it("includes issue_created when issues exist", async () => {
    const issues = [
      {
        id: "iss-1",
        title: "Bug X",
        created_at: "2026-01-01T10:00:00Z",
        updated_at: "2026-01-01T10:00:00Z",
        resolved_at: null,
        resolved_by: null,
        status: "open",
        created_by: "user-1",
      },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_issues") {
          return mockChain({ data: issues, error: null });
        }
        return mockChain({ data: [], error: null });
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    expect(result.some((i) => i.eventType === "issue_created")).toBe(true);
    expect(result.find((i) => i.eventType === "issue_created")?.title).toContain("Bug X");
  });

  it("sorts by occurredAt descending", async () => {
    const issues = [
      {
        id: "iss-1",
        title: "Older",
        created_at: "2026-01-01T10:00:00Z",
        updated_at: "2026-01-01T10:00:00Z",
        resolved_at: null,
        resolved_by: null,
        status: "open",
        created_by: null,
      },
    ];
    const docs = [
      {
        id: "doc-1",
        title: "Newer",
        type: "contract",
        status: "approved",
        created_at: "2026-01-01T09:00:00Z",
        updated_at: "2026-01-02T12:00:00Z",
        created_by: null,
        decided_by: null,
      },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_issues") return mockChain({ data: issues, error: null });
        if (table === "project_documents") return mockChain({ data: docs, error: null });
        return mockChain({ data: [], error: null });
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const dates = result.map((i) => i.occurredAt);
    for (let j = 1; j < dates.length; j++) {
      expect(new Date(dates[j]).getTime()).toBeLessThanOrEqual(
        new Date(dates[j - 1]).getTime()
      );
    }
  });

  it("handles missing actor gracefully", async () => {
    const issues = [
      {
        id: "iss-1",
        title: "No actor",
        created_at: "2026-01-01T10:00:00Z",
        updated_at: "2026-01-01T10:00:00Z",
        resolved_at: null,
        resolved_by: null,
        status: "open",
        created_by: null,
      },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_issues") return mockChain({ data: issues, error: null });
        return mockChain({ data: [], error: null });
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    const item = result.find((i) => i.eventType === "issue_created");
    expect(item).toBeDefined();
    expect(item?.actorLabel).toBeNull();
  });

  it("includes issue_status_changed for in_review issues", async () => {
    const issues = [
      {
        id: "iss-1",
        title: "In review",
        created_at: "2026-01-01T10:00:00Z",
        updated_at: "2026-01-02T12:00:00Z",
        resolved_at: null,
        resolved_by: null,
        status: "in_review",
        created_by: "user-1",
      },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_issues") return mockChain({ data: issues, error: null });
        return mockChain({ data: [], error: null });
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    expect(result.some((i) => i.eventType === "issue_status_changed")).toBe(true);
  });

  it("includes document_resubmitted_for_review when decided_by is set", async () => {
    const docs = [
      {
        id: "doc-1",
        title: "Resubmitted",
        type: "contract",
        status: "under_review",
        created_at: "2026-01-01T09:00:00Z",
        updated_at: "2026-01-03T14:00:00Z",
        created_by: "user-1",
        decided_by: "owner-1",
      },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "project_documents") return mockChain({ data: docs, error: null });
        return mockChain({ data: [], error: null });
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    expect(result.some((i) => i.eventType === "document_resubmitted_for_review")).toBe(true);
  });

  it("includes task_assigned when assigned_to is set", async () => {
    const tasksAssigned = [
      {
        id: "task-1",
        title: "Build fence",
        status: "in_progress",
        updated_at: "2026-01-02T11:00:00Z",
        assigned_to: "worker-1",
      },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "worker_tasks") return mockChain({ data: tasksAssigned, error: null });
        return mockChain({ data: [], error: null });
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectTimeline(supabase, "proj-1", "tenant-1", 30);
    expect(result.some((i) => i.eventType === "task_assigned")).toBe(true);
  });
});
