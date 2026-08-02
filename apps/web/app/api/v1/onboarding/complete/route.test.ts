import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  createClient: vi.fn(),
  resolveTenantForCurrentUser: vi.fn(),
  createTenantAndOwnerMembershipForCurrentUser: vi.fn(),
  acceptUpsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => mocks.createClient(...args),
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/api/engine", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/engine")>("@/lib/api/engine");
  return {
    ...actual,
    resolveTenantForCurrentUser: (...args: unknown[]) => mocks.resolveTenantForCurrentUser(...args),
    createTenantAndOwnerMembershipForCurrentUser: (...args: unknown[]) =>
      mocks.createTenantAndOwnerMembershipForCurrentUser(...args),
  };
});

vi.mock("@/lib/account/account-workspace.service", () => ({
  AccountWorkspaceError: class AccountWorkspaceError extends Error {},
  syncAccountMemberForInternalTenantRole: vi.fn().mockResolvedValue(undefined),
}));

import { ActiveTenantBlockedError } from "@/lib/api/engine";
import { ACTIVE_TENANT_HEADER } from "@/lib/tenant/active-tenant";
import { POST } from "./route";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";

function supabaseStub() {
  return {
    from: () => {
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.maybeSingle = async () => ({ data: null, error: null });
      chain.upsert = async () => ({ error: null });
      chain.delete = () => chain;
      return chain;
    },
  };
}

describe("POST /api/v1/onboarding/complete active-tenant fail-closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(supabaseStub());
    mocks.getSessionUser.mockResolvedValue({ id: "user-1", email: "u@example.com" });
    mocks.createTenantAndOwnerMembershipForCurrentUser.mockResolvedValue(T1);
  });

  it("refuses auto-create on invalid x-tenant-id (no workspace creation)", async () => {
    mocks.resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });

    const res = await POST(
      new Request("https://test/api/v1/onboarding/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [ACTIVE_TENANT_HEADER]: "not-a-uuid",
        },
        body: JSON.stringify({ persona: "contractor", companyName: "Acme" }),
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("ACTIVE_TENANT_BLOCKED");
    expect(mocks.createTenantAndOwnerMembershipForCurrentUser).not.toHaveBeenCalled();
  });

  it("refuses auto-create on unauthorized explicit tenant", async () => {
    mocks.resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: false,
    });

    const res = await POST(
      new Request("https://test/api/v1/onboarding/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [ACTIVE_TENANT_HEADER]: T2,
        },
        body: JSON.stringify({ persona: "contractor", companyName: "Acme" }),
      })
    );
    expect(res.status).toBe(403);
    expect(mocks.createTenantAndOwnerMembershipForCurrentUser).not.toHaveBeenCalled();
  });

  it("refuses auto-create on active-tenant query error", async () => {
    mocks.resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: true,
      queryError: true,
    });

    const res = await POST(
      new Request("https://test/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "contractor", companyName: "Acme" }),
      })
    );
    expect(res.status).toBe(503);
    expect(mocks.createTenantAndOwnerMembershipForCurrentUser).not.toHaveBeenCalled();
  });

  it("maps ActiveTenantBlockedError from create helper to blocked response", async () => {
    mocks.resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: false,
    });
    mocks.createTenantAndOwnerMembershipForCurrentUser.mockRejectedValue(
      new ActiveTenantBlockedError({
        tenantId: null,
        source: "none",
        explicitRejected: true,
        queryError: false,
      })
    );

    const res = await POST(
      new Request("https://test/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "contractor", companyName: "Acme" }),
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("ACTIVE_TENANT_BLOCKED");
  });

  it("creates workspace when resolution is cleanly absent (no explicit claim)", async () => {
    mocks.resolveTenantForCurrentUser.mockResolvedValue({
      tenantId: null,
      source: "none",
      explicitRejected: false,
      queryError: false,
    });

    const res = await POST(
      new Request("https://test/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "contractor", companyName: "Acme" }),
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.createTenantAndOwnerMembershipForCurrentUser).toHaveBeenCalledTimes(1);
  });
});
