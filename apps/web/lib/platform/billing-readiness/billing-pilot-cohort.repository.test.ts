import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getBillingPilotWorkspaceByWorkspaceId,
  listBillingPilotWorkspaces,
  upsertBillingPilotWorkspace,
  removeBillingPilotWorkspace,
} from "./billing-pilot-cohort.repository";

function mockSupabase(responses: {
  getSingle?: { data: unknown; error: unknown };
  list?: { data: unknown[]; error: unknown };
  upsert?: { data: unknown; error: unknown };
  delete?: { error: unknown };
}) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(responses.list ?? { data: [], error: null }),
    maybeSingle: vi.fn().mockResolvedValue(responses.getSingle ?? { data: null, error: null }),
    select: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(responses.upsert ?? { data: null, error: null }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(responses.delete ?? { error: null }),
    }),
  };
  return {
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient;
}

describe("billing-pilot-cohort.repository (Step 19)", () => {
  it("getBillingPilotWorkspaceByWorkspaceId returns null when no row", async () => {
    const supabase = mockSupabase({ getSingle: { data: null, error: null } });
    const result = await getBillingPilotWorkspaceByWorkspaceId(supabase, "w1");
    expect(result).toBeNull();
  });

  it("getBillingPilotWorkspaceByWorkspaceId returns record when found", async () => {
    const row = {
      workspace_id: "w1",
      live_checkout_enabled: true,
      webhook_processing_enabled: false,
      cohort_label: "test",
      notes: null,
      enabled_by: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const supabase = mockSupabase({ getSingle: { data: row, error: null } });
    const result = await getBillingPilotWorkspaceByWorkspaceId(supabase, "w1");
    expect(result).toEqual({
      workspaceId: "w1",
      liveCheckoutEnabled: true,
      webhookProcessingEnabled: false,
      cohortLabel: "test",
      notes: null,
      enabledBy: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("upsertBillingPilotWorkspace succeeds", async () => {
    const row = {
      workspace_id: "w1",
      live_checkout_enabled: true,
      webhook_processing_enabled: true,
      cohort_label: null,
      notes: null,
      enabled_by: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const supabase = mockSupabase({ upsert: { data: row, error: null } });
    const { data, error } = await upsertBillingPilotWorkspace(supabase, { workspaceId: "w1" });
    expect(error).toBeNull();
    expect(data?.workspaceId).toBe("w1");
  });

  it("removeBillingPilotWorkspace succeeds", async () => {
    const supabase = mockSupabase({ delete: { error: null } });
    const { error } = await removeBillingPilotWorkspace(supabase, "w1");
    expect(error).toBeNull();
  });

  it("listBillingPilotWorkspaces returns empty when no rows", async () => {
    const supabase = mockSupabase({ list: { data: [], error: null } });
    const result = await listBillingPilotWorkspaces(supabase);
    expect(result).toEqual([]);
  });
});
