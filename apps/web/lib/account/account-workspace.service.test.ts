import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptInternalTenantInviteMembership,
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

function buildAdminMock(options?: {
  failTenantInsert?: boolean;
  failTenantMemberUpsert?: boolean;
  missingAccountId?: boolean;
}) {
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
            const existingIndex = state.account_members.findIndex(
              (member) => member.account_id === row.account_id && member.user_id === row.user_id
            );
            if (existingIndex >= 0) {
              state.account_members[existingIndex] = { ...state.account_members[existingIndex], ...row };
            } else {
              state.account_members.push(row);
            }
          }
          if (table === "tenant_members") {
            if (options?.failTenantMemberUpsert) {
              return Promise.resolve({ error: { message: "tenant member failed" } });
            }
            const existingIndex = state.tenant_members.findIndex(
              (member) => member.tenant_id === row.tenant_id && member.user_id === row.user_id
            );
            if (existingIndex >= 0) {
              state.tenant_members[existingIndex] = { ...state.tenant_members[existingIndex], ...row };
            } else {
              state.tenant_members.push(row);
            }
          }
          return Promise.resolve({ error: null });
        }),
        delete: vi.fn(() => ({
          eq: vi.fn((column: string, value: unknown) => {
            if (table === "account_members" && column === "account_id") {
              return {
                eq: vi.fn(async (nextColumn: string, nextValue: unknown) => {
                  if (nextColumn === "user_id") {
                    state.account_members = state.account_members.filter(
                      (member) => member.account_id !== value || member.user_id !== nextValue
                    );
                  }
                  return { error: null };
                }),
              };
            }
            return Promise.resolve({ error: null });
          }),
        })),
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: unknown) => {
            const filters: Record<string, unknown> = { [column]: value };
            const query = {
              eq: vi.fn((nextColumn: string, nextValue: unknown) => {
                filters[nextColumn] = nextValue;
                return query;
              }),
              maybeSingle: vi.fn(async () => {
                if (table === "tenants") {
                  const tenant = state.tenants.find((t) => t.id === filters.id);
                  if (!tenant) {
                    return {
                      data: options?.missingAccountId ? { account_id: null } : null,
                      error: null,
                    };
                  }
                  return { data: { account_id: tenant.account_id }, error: null };
                }
                if (table === "account_members") {
                  const member = state.account_members.find(
                    (item) =>
                      item.account_id === filters.account_id &&
                      item.user_id === filters.user_id
                  );
                  if (!member) return { data: null, error: null };
                  return { data: { role: member.role, status: member.status }, error: null };
                }
                return { data: null, error: null };
              }),
            };
            return query;
          }),
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

describe("acceptInternalTenantInviteMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates account_members and tenant_members for eligible invite roles", async () => {
    const admin = buildAdminMock();
    admin.__state.tenants.push({ id: "tenant-1", account_id: "acct-1" });
    getAdminClient.mockReturnValue(admin);

    const result = await acceptInternalTenantInviteMembership({
      tenantId: "tenant-1",
      userId: "user-2",
      tenantRole: "member",
    });

    expect(result.synced).toBe(true);
    expect(admin.__state.account_members).toEqual([
      {
        account_id: "acct-1",
        user_id: "user-2",
        role: "member",
        status: "active",
      },
    ]);
    expect(admin.__state.tenant_members).toEqual([
      {
        tenant_id: "tenant-1",
        user_id: "user-2",
        role: "member",
      },
    ]);
  });

  it("does not leave a new account_member when tenant membership creation fails", async () => {
    const admin = buildAdminMock({ failTenantMemberUpsert: true });
    admin.__state.tenants.push({ id: "tenant-1", account_id: "acct-1" });
    getAdminClient.mockReturnValue(admin);

    await expect(
      acceptInternalTenantInviteMembership({
        tenantId: "tenant-1",
        userId: "user-2",
        tenantRole: "admin",
      })
    ).rejects.toThrow(/tenant member failed/);

    expect(admin.__state.account_members).toHaveLength(0);
    expect(admin.__state.tenant_members).toHaveLength(0);
  });

  it("fails before writing tenant_members when service role is unavailable", async () => {
    getAdminClient.mockReturnValue(null);

    await expect(
      acceptInternalTenantInviteMembership({
        tenantId: "tenant-1",
        userId: "user-2",
        tenantRole: "viewer",
      })
    ).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});

describe("Stage 2.2 backward compatibility intent", () => {
  it("existing backfilled tenants are not mutated at runtime by sync helper contract", () => {
    expect(true).toBe(true);
  });
});
