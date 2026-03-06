import { describe, expect, it, vi } from "vitest";
import { enqueuePushToUser } from "./push.service";

vi.mock("@/lib/platform/jobs/job.service", () => ({
  enqueueJob: vi.fn().mockResolvedValue(undefined),
}));

describe("enqueuePushToUser", () => {
  it("returns 0 when user has no devices", async () => {
    const admin = {
      from: (table: string) => {
        if (table === "device_tokens") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => Promise.resolve({ data: [] }),
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as any;
    const count = await enqueuePushToUser(admin, {
      tenantId: "t1",
      userId: "u1",
      type: "task_assigned",
      payload: { task_id: "task1" },
    });
    expect(count).toBe(0);
  });

  it("enqueues one row per device (two devices => two records)", async () => {
    const inserts: Record<string, unknown>[] = [];
    const admin = {
      from: (table: string) => {
        if (table === "device_tokens") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  is: () =>
                    Promise.resolve({
                      data: [
                        { platform: "ios", device_id: "dev1" },
                        { platform: "android", device_id: "dev2" },
                      ],
                    }),
                }),
              }),
            }),
          };
        }
        if (table === "push_outbox") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({
                      eq: () => ({
                        limit: () => Promise.resolve({ data: [] }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: (row: Record<string, unknown>) => {
              inserts.push(row);
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      },
    } as any;
    const count = await enqueuePushToUser(admin, {
      tenantId: "t1",
      userId: "u1",
      type: "task_assigned",
      payload: { task_id: "task1", project_id: "p1" },
    });
    expect(count).toBe(2);
    expect(inserts).toHaveLength(2);
    expect(inserts.map((r) => r.device_id).sort()).toEqual(["dev1", "dev2"]);
    expect(inserts[0]).toMatchObject({
      tenant_id: "t1",
      user_id: "u1",
      device_id: expect.any(String),
      type: "task_assigned",
      payload: { task_id: "task1", project_id: "p1" },
      status: "queued",
    });
  });

  it("dedupes on repeat assign: no duplicate outbox rows when queued row exists per device", async () => {
    const inserts: Record<string, unknown>[] = [];
    let selectCallCount = 0;
    const admin = {
      from: (table: string) => {
        if (table === "device_tokens") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  is: () =>
                    Promise.resolve({
                      data: [
                        { platform: "ios", device_id: "dev1" },
                        { platform: "ios", device_id: "dev2" },
                      ],
                    }),
                }),
              }),
            }),
          };
        }
        if (table === "push_outbox") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({
                      eq: () => ({
                        limit: () => {
                          selectCallCount++;
                          return Promise.resolve({
                            data: selectCallCount <= 2 ? [] : [{ payload: { task_id: "task1" } }],
                          });
                        },
                      }),
                    }),
                  }),
                }),
              }),
            }),
            insert: (row: Record<string, unknown>) => {
              inserts.push(row);
              return Promise.resolve({ error: null });
            },
          };
        }
        return {};
      },
    } as any;
    const count = await enqueuePushToUser(admin, {
      tenantId: "t1",
      userId: "u1",
      type: "task_assigned",
      payload: { task_id: "task1" },
    });
    expect(count).toBe(2);
    expect(inserts).toHaveLength(2);
    inserts.length = 0;
    const count2 = await enqueuePushToUser(admin, {
      tenantId: "t1",
      userId: "u1",
      type: "task_assigned",
      payload: { task_id: "task1" },
    });
    expect(count2).toBe(0);
    expect(inserts).toHaveLength(0);
  });
});
