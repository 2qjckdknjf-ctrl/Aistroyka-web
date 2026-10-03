import { describe, expect, it, vi } from "vitest";
import { createCustomerIntakeDraft } from "./customer-intake.service";

describe("createCustomerIntakeDraft", () => {
  it("rejects empty title", async () => {
    const r = await createCustomerIntakeDraft({} as never, { tenantId: "t", userId: "u" } as never, {
      title: " ",
      description: "need a kitchen",
    });
    expect(r.error).toMatch(/title/);
  });

  it("inserts a draft without AI fields", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "d1",
        tenant_id: "t",
        project_id: null,
        title: "Kitchen",
        description: "Need remodel",
        site_context: null,
        location: { precision: "city" },
        requested_work_type: "remodel",
        budget_range: null,
        desired_start: null,
        desired_end: null,
        media_refs: [],
        questions: [],
        status: "draft",
        created_at: "2026-10-03T00:00:00Z",
        updated_at: "2026-10-03T00:00:00Z",
      },
      error: null,
    });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: () => ({ select: () => ({ maybeSingle }) }),
      }),
    };
    const r = await createCustomerIntakeDraft(supabase as never, { tenantId: "t", userId: "u" } as never, {
      title: "Kitchen",
      description: "Need remodel",
      requested_work_type: "remodel",
    });
    expect(r.error).toBe("");
    expect(r.data?.status).toBe("draft");
    expect(JSON.stringify(r.data)).not.toMatch(/analysis|matching|ai_result/i);
  });
});
