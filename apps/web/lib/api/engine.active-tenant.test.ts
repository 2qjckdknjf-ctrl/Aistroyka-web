import { beforeEach, describe, expect, it, vi } from "vitest";

const createContractorWorkspaceForUser = vi.fn();

vi.mock("@/lib/account/account-workspace.service", () => ({
  createContractorWorkspaceForUser: (...args: unknown[]) => createContractorWorkspaceForUser(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));

vi.mock("./rpcClient", () => ({
  createAnalysisJobRpc: vi.fn(),
}));

import {
  ActiveTenantBlockedError,
  createTenantAndOwnerMembershipForCurrentUser,
} from "./engine";
import { ACTIVE_TENANT_HEADER } from "@/lib/tenant/active-tenant";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";

function makeSupabase(opts: {
  accessAllowed?: boolean;
  accessQueryError?: boolean;
  ownedId?: string | null;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "u@example.com", user_metadata: {} } },
      }),
    },
    from: (table: string) => {
      const state: { filters: Record<string, string> } = { filters: {} };
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = (col: string, val: string) => {
        state.filters[col] = val;
        return chain;
      };
      chain.order = () => chain;
      chain.limit = () => chain;
      chain.maybeSingle = async () => {
        if (table === "tenants") {
          if (state.filters.id && state.filters.user_id) {
            if (opts.accessQueryError) return { data: null, error: { message: "boom" } };
            return {
              data: opts.accessAllowed ? { id: state.filters.id } : null,
              error: null,
            };
          }
          if (state.filters.user_id && !state.filters.id) {
            return {
              data: opts.ownedId ? { id: opts.ownedId } : null,
              error: null,
            };
          }
        }
        if (table === "tenant_members") {
          if (state.filters.tenant_id && state.filters.user_id) {
            return { data: null, error: null };
          }
          if (state.filters.user_id && !state.filters.tenant_id) {
            return { data: null, error: null };
          }
        }
        if (table === "tenant_invitations") {
          return { data: null, error: null };
        }
        return { data: null, error: null };
      };
      return chain;
    },
  } as never;
}

describe("createTenantAndOwnerMembershipForCurrentUser fail-closed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createContractorWorkspaceForUser.mockResolvedValue({ tenantId: T1 });
  });

  it("throws ActiveTenantBlockedError for unauthorized explicit header (no create)", async () => {
    const supabase = makeSupabase({ accessAllowed: false, ownedId: null });
    const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: T2 } });
    await expect(
      createTenantAndOwnerMembershipForCurrentUser(supabase, { name: "Acme" }, req)
    ).rejects.toBeInstanceOf(ActiveTenantBlockedError);
    expect(createContractorWorkspaceForUser).not.toHaveBeenCalled();
  });

  it("throws ActiveTenantBlockedError for invalid UUID header (no create)", async () => {
    const supabase = makeSupabase({ ownedId: null });
    const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: "evil" } });
    await expect(
      createTenantAndOwnerMembershipForCurrentUser(supabase, { name: "Acme" }, req)
    ).rejects.toBeInstanceOf(ActiveTenantBlockedError);
    expect(createContractorWorkspaceForUser).not.toHaveBeenCalled();
  });

  it("throws ActiveTenantBlockedError on access DB error (no create)", async () => {
    const supabase = makeSupabase({ accessQueryError: true, ownedId: null });
    const req = new Request("https://x/api", { headers: { [ACTIVE_TENANT_HEADER]: T2 } });
    await expect(
      createTenantAndOwnerMembershipForCurrentUser(supabase, { name: "Acme" }, req)
    ).rejects.toBeInstanceOf(ActiveTenantBlockedError);
    expect(createContractorWorkspaceForUser).not.toHaveBeenCalled();
  });

  it("creates when no explicit claim and no existing tenant", async () => {
    const supabase = makeSupabase({ ownedId: null });
    const id = await createTenantAndOwnerMembershipForCurrentUser(supabase, { name: "Acme" }, null);
    expect(id).toBe(T1);
    expect(createContractorWorkspaceForUser).toHaveBeenCalledTimes(1);
  });
});
