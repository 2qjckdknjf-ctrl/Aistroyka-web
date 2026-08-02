import { describe, expect, it, vi } from "vitest";
import { getById } from "./project.repository";

describe("project.repository getById", () => {
  it("selects client portal flags required by canReadClientPortalView", async () => {
    let selectClause = "";
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "p1",
        name: "N",
        tenant_id: "t1",
        created_at: "2026-01-01",
        client_portal_enabled: true,
        client_show_budget_summary: false,
      },
      error: null,
    });
    const eq2 = vi.fn().mockReturnValue({ maybeSingle });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const select = vi.fn((clause: string) => {
      selectClause = clause;
      return { eq: eq1 };
    });
    const supabase = {
      from: vi.fn().mockReturnValue({ select }),
    };

    const row = await getById(supabase as never, "p1", "t1");
    expect(selectClause).toContain("client_portal_enabled");
    expect(selectClause).toContain("client_show_budget_summary");
    expect(row?.client_portal_enabled).toBe(true);
  });
});
