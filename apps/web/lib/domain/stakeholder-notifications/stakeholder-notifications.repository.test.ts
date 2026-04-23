import { describe, expect, it, vi } from "vitest";
import * as repo from "./stakeholder-notifications.repository";
import type { StakeholderNotificationRow } from "./stakeholder-notifications.types";

function mockRow(partial: Partial<StakeholderNotificationRow>): StakeholderNotificationRow {
  return {
    id: "n1",
    tenant_id: "t1",
    project_id: "p1",
    recipient_user_id: "u1",
    recipient_email: "a@b.com",
    kind: "client_request_new",
    status: "email_sent",
    channel: "both",
    payload: { title: "Pick a date", instructions: "Please choose" },
    stakeholder_invite_id: null,
    client_request_id: "r1",
    email_attempted_at: null,
    email_delivered_at: null,
    read_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("stakeholder-notifications.repository", () => {
  it("rowToPublic maps kinds to readable title/body", () => {
    const pub = repo.rowToPublic(
      mockRow({
        kind: "client_request_new",
        payload: { title: "T", instructions: "I" },
      })
    );
    expect(pub.title).toBe("T");
    expect(pub.body).toBe("I");
  });

  it("hasRecentReminderForRequest queries with kind and window", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count: 1 }),
        }),
      }),
    };
    const out = await repo.hasRecentReminderForRequest(
      supabase as any,
      "t1",
      "r1",
      "client_request_reminder",
      "2026-01-01T00:00:00.000Z"
    );
    expect(out).toBe(true);
  });
});
