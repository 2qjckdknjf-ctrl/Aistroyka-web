import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activationBaseline,
  loginAuditDetails,
  notificationOpenDetails,
  recordLoginSuccess,
  recordNotificationOpened,
} from "./product-events";

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
        { user_id: "u1", action: "task_assignment", created_at: "2026-09-02T00:00:00.000Z" },
        { user_id: null, action: "login", created_at: "2026-09-01T00:00:00.000Z" },
      ]),
    ).toEqual({ loginUsers: 0, activatedUsers: 0, rate: null });
  });

  it("leaves viewer and stakeholder logins out of the denominator", () => {
    expect(
      activationBaseline([
        { user_id: "u1", action: "login", created_at: "2026-09-01T00:00:00.000Z", role: "stakeholder" },
        { user_id: "u2", action: "login", created_at: "2026-09-01T00:00:00.000Z", role: "member" },
        { user_id: "u2", action: "report_submit", created_at: "2026-09-02T00:00:00.000Z" },
      ]),
    ).toEqual({ loginUsers: 1, activatedUsers: 1, rate: 1 });
  });

  it("counts a core action only after the first login and within seven days", () => {
    expect(
      activationBaseline([
        { user_id: "u1", action: "task_assignment", created_at: "2026-08-01T00:00:00.000Z" },
        { user_id: "u1", action: "login", created_at: "2026-09-01T00:00:00.000Z" },
        { user_id: "u1", action: "report_submit", created_at: "2026-09-03T00:00:00.000Z" },
        { user_id: "u2", action: "login", created_at: "2026-09-01T00:00:00.000Z" },
        { user_id: "u2", action: "report_review", created_at: "2026-09-20T00:00:00.000Z" },
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

  it("keeps the first stored login when the service client already has one", async () => {
    vi.mocked(emitAudit).mockClear();
    const admin = {
      from() {
        const chain = {
          eq() {
            return chain;
          },
          limit: async () => ({ data: [{ id: "existing" }] }),
        };
        return { select: () => chain };
      },
    } as unknown as SupabaseClient;
    await recordLoginSuccess(supabaseWithMembership(), "user-1", "ios_worker", admin);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("returns when the workspace lookup stalls", async () => {
    const hung = {
      from() {
        return {
          select() {
            return {
              eq() {
                return { maybeSingle: () => new Promise(() => undefined) };
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;
    const started = Date.now();
    await recordLoginSuccess(hung, "user-1", "web", null, 40);
    expect(Date.now() - started).toBeLessThan(500);
  });
});

const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_NOTIFICATION_ID = "22222222-2222-4222-8222-222222222222";

describe("notification_opened", () => {
  it("keeps only categorical open details", () => {
    expect(
      notificationOpenDetails({
        client: "ios_manager",
        role: "admin",
        notificationType: "task_assigned",
        destinationKind: "task",
      }),
    ).toEqual({
      client: "ios_manager",
      role: "admin",
      notification_type: "task_assigned",
      destination_kind: "task",
      source: "inbox",
    });
    const dirty = notificationOpenDetails({
      client: "user@example.com",
      role: "not-a-role",
      notificationType: "Hello title",
      destinationKind: "https://example.com/file.pdf",
    });
    expect(dirty).toEqual({ source: "inbox" });
    expect(JSON.stringify(dirty)).not.toContain("@");
  });

  it("writes one open and skips the same notification", async () => {
    const inserts: unknown[] = [];
    function client(existing: boolean): SupabaseClient {
      return {
        from() {
          const chain = {
            eq() {
              return chain;
            },
            limit: async () => ({ data: existing ? [{ id: "existing" }] : [] }),
            insert: async (row: unknown) => {
              inserts.push(row);
              return { error: null };
            },
          };
          return {
            select() {
              return chain;
            },
            insert: chain.insert,
          };
        },
      } as unknown as SupabaseClient;
    }
    const fresh = client(false);
    await recordNotificationOpened({
      writer: fresh,
      admin: fresh,
      tenantId: "tenant-1",
      userId: "user-1",
      notificationId: NOTIFICATION_ID,
      role: "member",
      clientHeader: "web",
      notificationType: "task_assigned",
      destinationKind: "task",
    });
    expect(inserts).toHaveLength(1);
    expect(JSON.stringify(inserts[0])).not.toContain("@");

    const seen = client(true);
    await recordNotificationOpened({
      writer: seen,
      admin: seen,
      tenantId: "tenant-1",
      userId: "user-1",
      notificationId: NOTIFICATION_ID,
      role: "member",
      clientHeader: "web",
    });
    expect(inserts).toHaveLength(1);

    await recordNotificationOpened({
      writer: fresh,
      admin: fresh,
      tenantId: "tenant-1",
      userId: "user-1",
      notificationId: OTHER_NOTIFICATION_ID,
      role: "member",
      clientHeader: "android_worker",
      notificationType: "report_ready",
      destinationKind: "report",
    });
    expect(inserts).toHaveLength(2);
  });

  it("does not write an invalid notification id and returns when the lookup stalls", async () => {
    const inserts: unknown[] = [];
    const writer = {
      from() {
        return {
          insert: async (row: unknown) => {
            inserts.push(row);
            return { error: null };
          },
        };
      },
    } as unknown as SupabaseClient;
    await recordNotificationOpened({
      writer,
      tenantId: "tenant-1",
      userId: "user-1",
      notificationId: "not-an-id",
    });
    expect(inserts).toHaveLength(0);

    const hung = {
      from() {
        const chain = {
          eq() {
            return chain;
          },
          limit: () => new Promise(() => undefined),
        };
        return { select: () => chain };
      },
    } as unknown as SupabaseClient;
    const started = Date.now();
    await recordNotificationOpened({
      writer: hung,
      admin: hung,
      tenantId: "tenant-1",
      userId: "user-1",
      notificationId: NOTIFICATION_ID,
      timeoutMs: 40,
    });
    expect(Date.now() - started).toBeLessThan(500);
  });
});
