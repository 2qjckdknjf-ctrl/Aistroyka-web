import { describe, expect, it, vi } from "vitest";
import { AI_ERROR_CODES } from "./ai-media-errors";
import { verifyProjectBelongsToTenant } from "./verify-project-tenant";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const projectA = "55555555-5555-4555-8555-555555555555";
const projectB = "66666666-6666-4666-8666-666666666666";

function makeProjectsClient(opts: {
  row?: { id: string } | null;
  error?: { message: string } | null;
  throwOnQuery?: boolean;
}) {
  const maybeSingle = vi.fn(async () => {
    if (opts.throwOnQuery) throw new Error("network");
    return { data: opts.row ?? null, error: opts.error ?? null };
  });
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: eq1 })),
    })),
    _eq: { eq1, eq2, maybeSingle },
  } as any;
}

describe("verifyProjectBelongsToTenant", () => {
  it("proves ownership when projects.id + tenant_id match", async () => {
    const supabase = makeProjectsClient({ row: { id: projectA } });
    const result = await verifyProjectBelongsToTenant(supabase, projectA, tenantA);
    expect(result).toEqual({ ok: true, projectId: projectA });
    expect(supabase._eq.eq1).toHaveBeenCalledWith("id", projectA);
    expect(supabase._eq.eq2).toHaveBeenCalledWith("tenant_id", tenantA);
  });

  it("denies missing project", async () => {
    const supabase = makeProjectsClient({ row: null });
    const result = await verifyProjectBelongsToTenant(supabase, projectB, tenantA);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);
      expect(result.retryable).toBe(false);
      expect(result.reason).not.toContain(projectB);
      expect(result.reason).not.toContain(tenantB);
    }
  });

  it("returns retryable error on DB failure", async () => {
    const supabase = makeProjectsClient({ error: { message: "db down" } });
    const result = await verifyProjectBelongsToTenant(supabase, projectA, tenantA);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe(AI_ERROR_CODES.AI_MEDIA_STORAGE_TEMPORARY);
      expect(result.retryable).toBe(true);
    }
  });

  it("denies non-uuid inputs without querying", async () => {
    const supabase = makeProjectsClient({ row: { id: projectA } });
    const result = await verifyProjectBelongsToTenant(supabase, "not-a-uuid", tenantA);
    expect(result.ok).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
