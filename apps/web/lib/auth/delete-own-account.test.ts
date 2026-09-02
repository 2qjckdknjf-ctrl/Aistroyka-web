import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_DELETE_CONFIRM,
  deleteOwnAccountRecords,
  isAccountDeleteConfirm,
} from "./delete-own-account";

describe("isAccountDeleteConfirm", () => {
  it("accepts exact DELETE confirm", () => {
    expect(isAccountDeleteConfirm({ confirm: ACCOUNT_DELETE_CONFIRM })).toBe(true);
  });

  it("rejects missing, empty, or lookalike confirm", () => {
    expect(isAccountDeleteConfirm(null)).toBe(false);
    expect(isAccountDeleteConfirm({})).toBe(false);
    expect(isAccountDeleteConfirm({ confirm: "delete" })).toBe(false);
    expect(isAccountDeleteConfirm({ confirm: " DELETE " })).toBe(true);
    expect(isAccountDeleteConfirm({ confirm: "YES" })).toBe(false);
  });
});

describe("deleteOwnAccountRecords", () => {
  it("deletes memberships then the same auth user id", async () => {
    const tables: string[] = [];
    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: (table: string) => {
        tables.push(table);
        return {
          delete: () => ({
            eq: async (column: string, value: string) => {
              expect(column).toBe("user_id");
              expect(value).toBe("user-1");
              return { error: null };
            },
          }),
        };
      },
      auth: { admin: { deleteUser } },
    };

    await expect(deleteOwnAccountRecords(admin, "user-1")).resolves.toEqual({ error: null });
    expect(tables).toEqual([
      "device_tokens",
      "user_identities",
      "project_members",
      "tenant_members",
      "account_members",
    ]);
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith("user-1", true);
  });

  it("does not call deleteUser when membership cleanup fails", async () => {
    const deleteUser = vi.fn();
    const admin = {
      from: () => ({
        delete: () => ({
          eq: async () => ({ error: { message: "rls" } }),
        }),
      }),
      auth: { admin: { deleteUser } },
    };

    await expect(deleteOwnAccountRecords(admin, "user-1")).resolves.toEqual({ error: "rls" });
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("rejects empty user id", async () => {
    const deleteUser = vi.fn();
    const admin = {
      from: () => ({
        delete: () => ({
          eq: async () => ({ error: null }),
        }),
      }),
      auth: { admin: { deleteUser } },
    };
    await expect(deleteOwnAccountRecords(admin, "  ")).resolves.toEqual({ error: "user_id required" });
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
