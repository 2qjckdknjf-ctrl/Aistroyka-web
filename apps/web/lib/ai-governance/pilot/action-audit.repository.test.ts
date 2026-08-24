import { describe, expect, it, vi, beforeEach } from "vitest";
import { insertAiActionAudit } from "./action-audit.repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({ getAdminClient: vi.fn() }));

describe("insertAiActionAudit", () => {
  beforeEach(() => {
    vi.mocked(getAdminClient).mockReset();
  });

  it("writes via service role admin client only", async () => {
    const insert = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: "audit-1" }, error: null }),
      }),
    }));
    vi.mocked(getAdminClient).mockReturnValue({
      from: vi.fn(() => ({ insert })),
    } as unknown as ReturnType<typeof getAdminClient>);

    const row = await insertAiActionAudit({} as SupabaseClient, {
      tenant_id: "t1",
      action_id: "validate_report_required_fields",
      policy_version: "pilot-v1",
      outcome: "dry_run",
    });

    expect(getAdminClient).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
    expect(row?.id).toBe("audit-1");
  });

  it("returns null when admin client unavailable", async () => {
    vi.mocked(getAdminClient).mockReturnValue(null);
    const row = await insertAiActionAudit({} as SupabaseClient, {
      tenant_id: "t1",
      action_id: "validate_report_required_fields",
      policy_version: "pilot-v1",
      outcome: "blocked",
    });
    expect(row).toBeNull();
  });
});
