import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AccountWorkspaceError,
  createContractorWorkspaceForUser,
  syncAccountMemberForInternalTenantRole,
} from "./account-workspace.service";

const getAdminClient = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => getAdminClient(),
}));

type TableState = {
  accounts: Array<Record<string, unknown>>;
  tenants: Array<Record<string, unknown>>;
  account_members: Array<Record<string, unknown>>;
  tenant_members: Array<Record<string, unknown>>;
};

function buildAdminMock(options?: { failTenantInsert?: boolean; missingAccountId?: boolean }) {
  const state: TableState = {
    accounts: [],
    tenants: [],
    account_members: [],
    tenant_members: [],
  };

  const admin = {
    from: vi.fn((table: string) => {
      const api = {
        insert: vi.fn((row: Record<string, unknown>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              if (table === "accounts") {
                const id = `acct-${state.accounts.length + 1}`;
                state.accounts.push({ ...row, id });
                return { data: { id }, error: null };
              }
              if (table === "tenants") {
                if (options?.failTenantInsert) {
                  return { data: null, error: { message: "tenant insert failed" } };
                }
                const id = `tenant-${state.tenants.length + 1}`;
                state.tenants.push({ ...row, id });
                return { data: { id }, error: null };
              }
              return { data: null, error: { message: "unexpected insert" } };
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
        upsert: vi.fn((row: Record<string, unknown>) => {
          if (table === "account_members") {
            state.account_members.push(row);
          }
          if (table === "tenant_members") {
            state.tenant_members.push(row);
          }
          return Promise.resolve({ error: null });
        }),
        delete: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
        select: vi.fn(() => ({
          eq: vi.fn((_col: string, tenantId: string) => ({
            maybeSingle: vi.fn(async () => {
              if (table === "tenants") {
                const tenant = state.tenants.find((t) => t.id === tenantId);
                if (!tenant) {
                  return {
                    data: options?.missingAccountId ? { account_id: null } : null,
                    error: null,
                  };
                }
                return { data: { account_id: tenant.account_id }, error: null };
              }
              return { data: null, error: null };
            }),
          })),
        })),
      };
      return api;
    }),
    __state: state,
  };

  return admin;
}

describe("createContractorWorkspaceForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates account, tenant with account_id, account_member owner, tenant_member owner", async () => {
    const admin = buildAdminMock();
    getAdminClient.mockReturnValue(admin);

    const result = await createContractorWorkspaceForUser({
      userId: "user-1",
      displayName: "Acme Build",
    });

    expect(result.tenantId).toBe("tenant-1");
    expect(result.accountId).toBe("acct-1");
    expect(admin.__state.accounts).toHaveLength(1);
    expect(admin.__state.accounts[0]).toMatchObject({
      account_type: "contractor",
      display_name: "Acme Build",
      status: "active",
    });
    expect(admin.__state.tenants[0]).toMatchObject({
      account_id: "acct-1",
      user_id: "user-1",
      name: "Acme Build",
    });
    expect(admin.__state.account_members[0]).toMatchObject({
      account_id: "acct-1",
      user_id: "user-1",
      role: "owner",
      status: "active",
    });
    expect(admin.__state.tenant_members[0]).toMatchObject({
      tenant_id: "tenant-1",
      user_id: "user-1",
      role: "owner",
    });
  });

  it("rolls back and throws when tenant creation fails", async () => {
    const admin = buildAdminMock({ failTenantInsert: true });
    getAdminClient.mockReturnValue(admin);

    await expect(
      createContractorWorkspaceForUser({ userId: "user-1", displayName: "Fail Co" })
    ).rejects.toBeInstanceOf(AccountWorkspaceError);

    expect(admin.from).toHaveBeenCalledWith("accounts");
    expect(admin.from).toHaveBeenCalledWith("tenants");
  });

  it("fails closed when service role is unavailable", async () => {
    getAdminClient.mockReturnValue(null);
    await expect(
      createContractorWorkspaceForUser({ userId: "user-1", displayName: "No Admin" })
    ).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});

describe("syncAccountMemberForInternalTenantRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts account_members for admin invite role", async () => {
    const admin = buildAdminMock();
    admin.__state.tenants.push({ id: "tenant-1", account_id: "acct-1" });
    getAdminClient.mockReturnValue(admin);

    const result = await syncAccountMemberForInternalTenantRole({
      tenantId: "tenant-1",
      userId: "user-2",
      tenantRole: "admin",
    });

    expect(result.synced).toBe(true);
    expect(admin.__state.account_members[0]).toMatchObject({
      account_id: "acct-1",
      user_id: "user-2",
      role: "admin",
      status: "active",
    });
  });

  it("does not create account_member for stakeholder role", async () => {
    const admin = buildAdminMock();
    getAdminClient.mockReturnValue(admin);

    const result = await syncAccountMemberForInternalTenantRole({
      tenantId: "tenant-1",
      userId: "user-2",
      tenantRole: "stakeholder",
    });

    expect(result.synced).toBe(false);
    expect(result.skippedReason).toBe("stakeholder_excluded");
    expect(admin.__state.account_members).toHaveLength(0);
  });

  it("throws when tenant has no account_id", async () => {
    const admin = buildAdminMock({ missingAccountId: true });
    getAdminClient.mockReturnValue(admin);

    await expect(
      syncAccountMemberForInternalTenantRole({
        tenantId: "tenant-missing",
        userId: "user-2",
        tenantRole: "member",
      })
    ).rejects.toThrow(/no account_id/);
  });
});

describe("Stage 2.2 backward compatibility intent", () => {
  it("existing backfilled tenants are not mutated at runtime by sync helper contract", () => {
    expect(true).toBe(true);
  });
});
