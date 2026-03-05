import { describe, expect, it, vi } from "vitest";
import { handlePushSend } from "./push-send";
import * as pushRouter from "@/lib/platform/push/push.provider.router";

vi.mock("@/lib/platform/push/push.provider.router", () => ({
  attemptSend: vi.fn(),
}));

function mockAdmin(overrides: {
  outboxRows?: Array<{ id: string; tenant_id: string; user_id: string; platform: string; type: string; payload: Record<string, unknown> | null; attempts: number }>;
  deviceTokens?: Array<{ device_id: string; token: string }>;
} = {}) {
  const { outboxRows = [], deviceTokens = [] } = overrides;
  const updates: { table: string; id?: string; update: Record<string, unknown> }[] = [];
  const admin = {
    from: (table: string) => {
      if (table === "push_outbox") {
        return {
          select: () => ({
            eq: () => ({
              or: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: outboxRows }),
                }),
              }),
            }),
          }),
          update: (update: Record<string, unknown>) => ({
            eq: (col: string, val: string) => {
              updates.push({ table, id: val, update });
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === "device_tokens") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => Promise.resolve({ data: deviceTokens }),
                }),
              }),
            }),
          }),
          update: (update: Record<string, unknown>) => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  in: () => {
                    updates.push({ table, update });
                    return Promise.resolve({ error: null });
                  },
                }),
              }),
            }),
          }),
        };
      }
      return {};
    },
  };
  return { admin: admin as any, updates };
}

describe("handlePushSend", () => {
  it("returns without error when outbox has no rows", async () => {
    const { admin } = mockAdmin({ outboxRows: [] });
    await expect(handlePushSend(admin, {} as any)).resolves.toBeUndefined();
  });

  it("updates outbox to failed with no_tokens when user has no device tokens", async () => {
    const { admin, updates } = mockAdmin({
      outboxRows: [
        {
          id: "ob1",
          tenant_id: "t1",
          user_id: "u1",
          platform: "ios",
          type: "report_submitted",
          payload: { title: "Hi" },
          attempts: 0,
        },
      ],
      deviceTokens: [],
    });
    await handlePushSend(admin, {} as any);
    const outboxUpdate = updates.find((u) => u.table === "push_outbox" && u.id === "ob1");
    expect(outboxUpdate).toBeDefined();
    expect(outboxUpdate!.update).toMatchObject({ status: "failed", last_error: "no_tokens" });
  });

  it("on invalid_token disables device token and updates outbox", async () => {
    vi.mocked(pushRouter.attemptSend).mockResolvedValue({ ok: false, code: "invalid_token" });
    const { admin, updates } = mockAdmin({
      outboxRows: [
        {
          id: "ob2",
          tenant_id: "t1",
          user_id: "u1",
          platform: "android",
          type: "task_assigned",
          payload: {},
          attempts: 0,
        },
      ],
      deviceTokens: [{ device_id: "d1", token: "tok1" }],
    });
    await handlePushSend(admin, {} as any);
    const dtUpdate = updates.find((u) => u.table === "device_tokens" && (u.update as any).disabled_at);
    expect(dtUpdate).toBeDefined();
    const outboxUpdate = updates.find((u) => u.table === "push_outbox" && u.id === "ob2");
    expect(outboxUpdate).toBeDefined();
    expect(outboxUpdate!.update.status).toBe("failed");
  });

  it("on retryable error sets next_retry_at and increments attempts", async () => {
    vi.mocked(pushRouter.attemptSend).mockResolvedValue({ ok: false, code: "retryable", message: "rate_limit" });
    const { admin, updates } = mockAdmin({
      outboxRows: [
        {
          id: "ob3",
          tenant_id: "t1",
          user_id: "u1",
          platform: "ios",
          type: "report_submitted",
          payload: {},
          attempts: 1,
        },
      ],
      deviceTokens: [{ device_id: "d1", token: "tok1" }],
    });
    await handlePushSend(admin, {} as any);
    const outboxUpdate = updates.find((u) => u.table === "push_outbox" && u.id === "ob3");
    expect(outboxUpdate).toBeDefined();
    expect(outboxUpdate!.update).toMatchObject({
      attempts: 2,
      last_error: "rate_limit",
    });
    expect((outboxUpdate!.update as any).next_retry_at).toBeDefined();
  });

  it("on success updates outbox to sent", async () => {
    vi.mocked(pushRouter.attemptSend).mockResolvedValue({ ok: true });
    const { admin, updates } = mockAdmin({
      outboxRows: [
        {
          id: "ob4",
          tenant_id: "t1",
          user_id: "u1",
          platform: "ios",
          type: "report_submitted",
          payload: {},
          attempts: 0,
        },
      ],
      deviceTokens: [{ device_id: "d1", token: "tok1" }],
    });
    await handlePushSend(admin, {} as any);
    const outboxUpdate = updates.find((u) => u.table === "push_outbox" && u.id === "ob4");
    expect(outboxUpdate).toBeDefined();
    expect(outboxUpdate!.update).toMatchObject({ status: "sent" });
  });
});
