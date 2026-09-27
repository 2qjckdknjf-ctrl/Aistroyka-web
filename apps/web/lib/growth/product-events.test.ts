import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { activationBaseline, loginAuditDetails, recordLoginSuccess } from "./product-events";

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: vi.fn(async () => undefined),
}));

import { emitAudit } from "@/lib/observability/audit.service";

function supabaseWithMembership(): SupabaseClient {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => (table === "tenants" ? { data: null } : { data: null }),
                then(resolve: (value: unknown) => unknown) {
                  return Promise.resolve(
                    table === "tenant_members"
                      ? { data: [{ tenant_id: "tenant-1", role: "admin" }] }
                      : { data: null },
                  ).then(resolve);
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("loginAuditDetails", () => {
  it("keeps only categorical client and role", () => {
    expect(
      loginAuditDetails({
        client: "ios_worker",
        role: "member",
      }),
    ).toEqual({ client: "ios_worker", role: "member" });
    expect(loginAuditDetails({ client: "user@example.com", role: "not-a-role" })).toEqual({});
  });
});

describe("activationBaseline", () => {
  it("returns a null rate when no login rows exist", () => {
    expect(
      activationBaseline([
        { user_id: "u1", action: "task_assignment" },
        { user_id: null, action: "login" },
      ]),
    ).toEqual({ loginUsers: 0, activatedUsers: 0, rate: null });
  });

  it("counts activation only from stored login plus core actions", () => {
    expect(
      activationBaseline([
        { user_id: "u1", action: "login" },
        { user_id: "u1", action: "report_submit" },
        { user_id: "u2", action: "login" },
        { user_id: "u3", action: "task_assignment" },
      ]),
    ).toEqual({ loginUsers: 2, activatedUsers: 1, rate: 0.5 });
  });
});

describe("recordLoginSuccess", () => {
  it("writes a login audit row without an email", async () => {
    vi.mocked(emitAudit).mockClear();
    await recordLoginSuccess(supabaseWithMembership(), "user-1", "web");
    expect(emitAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant_id: "tenant-1",
        user_id: "user-1",
        action: "login",
        details: { client: "web", role: "admin" },
      }),
    );
    const payload = vi.mocked(emitAudit).mock.calls[0]?.[1];
    expect(JSON.stringify(payload)).not.toContain("@");
  });

  it("skips the write when the user has no workspace", async () => {
    vi.mocked(emitAudit).mockClear();
    const empty = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: null }),
                  then(resolve: (value: unknown) => unknown) {
                    return Promise.resolve({ data: [] }).then(resolve);
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;
    await recordLoginSuccess(empty, "user-1", "web");
    expect(emitAudit).not.toHaveBeenCalled();
  });
});
