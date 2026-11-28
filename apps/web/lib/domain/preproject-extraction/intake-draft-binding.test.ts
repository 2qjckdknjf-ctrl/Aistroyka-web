import { describe, expect, it, vi } from "vitest";
import {
  listProjectIntakeDraftsForExtraction,
  resolveIntakeDraftForExtraction,
} from "./intake-draft-binding";

describe("AIS-CLIENT-005A intake-draft-binding", () => {
  it("returns DRAFT_NOT_FOUND for missing draft", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })),
    };
    const result = await resolveIntakeDraftForExtraction(supabase as never, {
      tenantId: "11111111-1111-4111-8111-111111111111",
      projectId: "22222222-2222-4222-8222-222222222222",
      intakeDraftId: "33333333-3333-4333-8333-333333333333",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("DRAFT_NOT_FOUND");
  });

  it("rejects cross-project drafts", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "33333333-3333-4333-8333-333333333333",
                  title: "Bath",
                  description: "tiling",
                  status: "submitted",
                  project_id: "99999999-9999-4999-8999-999999999999",
                  updated_at: "2026-10-30T00:00:00.000Z",
                },
                error: null,
              }),
            })),
          })),
        })),
      })),
    };
    const result = await resolveIntakeDraftForExtraction(supabase as never, {
      tenantId: "11111111-1111-4111-8111-111111111111",
      projectId: "22222222-2222-4222-8222-222222222222",
      intakeDraftId: "33333333-3333-4333-8333-333333333333",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("DRAFT_PROJECT_MISMATCH");
  });

  it("lists drafts without budget_range fields", async () => {
    const supabase = {
      from: vi.fn((table: string) => table === "preproject_extraction_runs" ? ({
        select: () => ({ eq: () => ({ in: async () => ({ data: [], error: null }) }) }),
      }) : ({
        select: vi.fn((cols: string) => {
          expect(cols).not.toMatch(/budget/i);
          return {
            eq: vi.fn(() => ({
              or: vi.fn(() => ({
                neq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "33333333-3333-4333-8333-333333333333",
                          title: "Kitchen",
                          description: "paint",
                          status: "draft",
                          project_id: "22222222-2222-4222-8222-222222222222",
                          updated_at: "2026-10-30T00:00:00.000Z",
                        },
                      ],
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          };
        }),
      })),
    };
    const result = await listProjectIntakeDraftsForExtraction(supabase as never, {
      tenantId: "11111111-1111-4111-8111-111111111111",
      projectId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.drafts).toHaveLength(1);
    expect(JSON.stringify(result.drafts)).not.toMatch(/budget/i);
  });

  it("rejects an unassigned draft already bound to a different project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        const data = table === "customer_intake_drafts" ? {
          id: "33333333-3333-4333-8333-333333333333", title: "Bath", description: "tiling",
          status: "submitted", project_id: null, updated_at: "2026-10-30T00:00:00.000Z",
        } : { project_id: "99999999-9999-4999-8999-999999999999" };
        const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data, error: null }) };
        return query;
      }),
    };
    expect(await resolveIntakeDraftForExtraction(supabase as never, {
      tenantId: "11111111-1111-4111-8111-111111111111", projectId: "22222222-2222-4222-8222-222222222222",
      intakeDraftId: "33333333-3333-4333-8333-333333333333",
    })).toMatchObject({ ok: false, code: "DRAFT_PROJECT_MISMATCH" });
  });

  it("omits an unassigned draft used by another project from the picker", async () => {
    const draftId = "33333333-3333-4333-8333-333333333333";
    const projectId = "22222222-2222-4222-8222-222222222222";
    const supabase = {
      from: vi.fn((table: string) => {
        const data = table === "customer_intake_drafts" ? [
          { id: draftId, title: "Bath", description: "tiling", status: "submitted", project_id: null, updated_at: "2026-10-30T00:00:00.000Z" },
          { id: "44444444-4444-4444-8444-444444444444", title: "Kitchen", description: "painting", status: "submitted", project_id: projectId, updated_at: "2026-10-30T00:00:00.000Z" },
        ] : [{ intake_draft_id: draftId, project_id: "99999999-9999-4999-8999-999999999999" }];
        const query = { select: () => query, eq: () => query, or: () => query, neq: () => query, order: () => query,
          limit: async () => ({ data, error: null }), in: async () => ({ data, error: null }) };
        return query;
      }),
    };
    const result = await listProjectIntakeDraftsForExtraction(supabase as never, {
      tenantId: "11111111-1111-4111-8111-111111111111", projectId,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.drafts.map(draft => draft.title)).toEqual(["Kitchen"]);
  });
});
