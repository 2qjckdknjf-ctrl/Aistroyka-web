import { describe, expect, it, vi } from "vitest";
import {
  getBillingPlatformSnapshot,
  getPlatformOverviewSnapshot,
  getPushOutboxHealthSnapshot,
} from "./platform-overview.service";

describe("platform overview service", () => {
  it("returns live tenant and project counts", async () => {
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "tenant_members") {
          return {
            select: vi.fn().mockResolvedValue({ data: [{ user_id: "u1" }], error: null }),
          };
        }
        if (table === "tenants") {
          return {
            select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.head) {
                return Promise.resolve({ count: 3, error: null });
              }
              return Promise.resolve({ data: [{ user_id: "u2" }], error: null });
            }),
          };
        }
        if (table === "tenant_invitations") {
          return {
            select: vi.fn(() => ({
              gt: vi.fn().mockResolvedValue({ count: 0, error: null }),
            })),
          };
        }
        if (table === "support_tickets") {
          return {
            select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.head) {
                return { in: vi.fn().mockResolvedValue({ count: 1, error: null }) };
              }
              return {
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              };
            }),
          };
        }
        if (table === "projects") {
          return {
            select: vi.fn().mockResolvedValue({ count: 5, error: null }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as Parameters<typeof getPlatformOverviewSnapshot>[0];

    const snapshot = await getPlatformOverviewSnapshot(admin);
    expect(snapshot.connected).toBe(true);
    expect(snapshot.totalTenants).toBe(3);
    expect(snapshot.totalProjects).toBe(5);
    expect(snapshot.activeUsers).toBe(2);
  });

  it("fails closed when queries throw", async () => {
    const admin = {
      from: vi.fn(() => {
        throw new Error("db down");
      }),
    } as unknown as Parameters<typeof getPlatformOverviewSnapshot>[0];

    const snapshot = await getPlatformOverviewSnapshot(admin);
    expect(snapshot.connected).toBe(false);
    expect(snapshot.totalTenants).toBeNull();
  });

  it("returns push outbox counts when table is reachable", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn().mockResolvedValue({ count: 2, error: null }),
          eq: vi.fn(() => ({
            gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
          })),
        })),
      })),
    } as unknown as Parameters<typeof getPushOutboxHealthSnapshot>[0];

    const snapshot = await getPushOutboxHealthSnapshot(admin);
    expect(snapshot.connected).toBe(true);
    expect(snapshot.pendingCount).toBe(2);
  });

  it("returns billing inventory counts", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ count: 4, error: null }),
      })),
    } as unknown as Parameters<typeof getBillingPlatformSnapshot>[0];

    const snapshot = await getBillingPlatformSnapshot(admin);
    expect(snapshot.connected).toBe(true);
    expect(snapshot.entitlementsRowCount).toBe(4);
    expect(snapshot.billingCustomersCount).toBe(4);
  });
});
