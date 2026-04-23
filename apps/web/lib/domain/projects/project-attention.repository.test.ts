import { describe, it, expect, vi } from "vitest";
import { getProjectAttentionSummary } from "./project-attention.repository";

function createEmptySupabase() {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  const select = vi.fn().mockReturnValue(chain);
  return {
    from: vi.fn().mockReturnValue({ select }),
  };
}

describe("getProjectAttentionSummary", () => {
  it("returns empty summary for quiet project (manager)", async () => {
    const supabase = createEmptySupabase() as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectAttentionSummary(
      supabase,
      "proj-1",
      "tenant-1",
      "manager"
    );

    expect(result.totalCount).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.sections).toHaveLength(0);
    expect(result.criticalCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  it("returns empty summary for quiet project (owner)", async () => {
    const supabase = createEmptySupabase() as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectAttentionSummary(
      supabase,
      "proj-1",
      "tenant-1",
      "owner"
    );

    expect(result.totalCount).toBe(0);
  });

  it("returns pending_decision items for owner when documents under_review", async () => {
    const docs = [
      { id: "doc-1", title: "Contract A", status: "under_review", created_at: "2026-01-01T00:00:00Z" },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain = {
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: table === "project_documents" ? docs : [],
            error: null,
          }),
        };
        return { select: vi.fn().mockReturnValue(chain) };
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const result = await getProjectAttentionSummary(
      supabase,
      "proj-1",
      "tenant-1",
      "owner"
    );

    expect(result.items.some((i) => i.type === "pending_decision")).toBe(true);
    expect(result.items[0].title).toBe("Contract A");
  });

  it("excludes open_issue for owner, includes for manager", async () => {
    const issues = [
      { id: "iss-1", title: "Bug X", status: "open", created_at: "2026-01-01T00:00:00Z" },
    ];
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        const chain = {
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: table === "project_issues" ? issues : [],
            error: null,
          }),
        };
        return { select: vi.fn().mockReturnValue(chain) };
      }),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const ownerResult = await getProjectAttentionSummary(
      supabase,
      "proj-1",
      "tenant-1",
      "owner"
    );
    const managerResult = await getProjectAttentionSummary(
      supabase,
      "proj-1",
      "tenant-1",
      "manager"
    );

    expect(ownerResult.items.filter((i) => i.type === "open_issue")).toHaveLength(0);
    expect(managerResult.items.filter((i) => i.type === "open_issue")).toHaveLength(1);
  });
});
