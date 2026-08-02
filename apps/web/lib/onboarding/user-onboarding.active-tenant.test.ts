import { describe, expect, it, vi } from "vitest";

const resolveTenantForCurrentUser = vi.fn();

vi.mock("@/lib/api/engine", () => ({
  resolveTenantForCurrentUser: (...args: unknown[]) => resolveTenantForCurrentUser(...args),
}));

import { shouldShowOnboarding } from "./user-onboarding";

function stubSupabase() {
  return {
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.maybeSingle = async () => ({ data: null, error: null });
      return chain;
    },
  } as never;
}

describe("shouldShowOnboarding fail-closed", () => {
  it("never prompts onboarding when explicit tenant selection is rejected", async () => {
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });
    const show = await shouldShowOnboarding(stubSupabase(), "user-1", new Request("https://x"));
    expect(show).toBe(false);
  });

  it("never prompts onboarding on active-tenant query error", async () => {
    resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: true,
    });
    const show = await shouldShowOnboarding(stubSupabase(), "user-1", null);
    expect(show).toBe(false);
  });
});
