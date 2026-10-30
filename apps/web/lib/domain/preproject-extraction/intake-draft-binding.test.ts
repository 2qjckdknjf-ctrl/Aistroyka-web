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
      from: vi.fn(() => ({
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
});
