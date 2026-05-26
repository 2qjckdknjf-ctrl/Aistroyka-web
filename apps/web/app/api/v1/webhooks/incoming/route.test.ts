import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/webhooks/webhook-verifier", () => ({
  verifyIncomingWebhook: vi.fn(),
}));

vi.mock("@/lib/webhooks/webhook-handler", () => ({
  handleIncomingWebhook: vi.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("POST /api/v1/webhooks/incoming", () => {
  it("returns 503 in production when signature enforcement is active but secret missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      WEBHOOK_INCOMING_SECRET: "",
    };
    delete process.env.WEBHOOK_INCOMING_ALLOW_UNSIGNED;

    const req = new Request("https://test/api/v1/webhooks/incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "evt-1", data: { tenantId: "t1" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("allows unsigned payload in production only when explicitly enabled", async () => {
    const { verifyIncomingWebhook } = await import("@/lib/webhooks/webhook-verifier");
    const { handleIncomingWebhook } = await import("@/lib/webhooks/webhook-handler");

    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      WEBHOOK_INCOMING_SECRET: "",
      WEBHOOK_INCOMING_ALLOW_UNSIGNED: "true",
    };

    vi.mocked(verifyIncomingWebhook).mockResolvedValue({
      valid: true,
      payload: { id: "evt-2", data: { tenantId: "t1" } },
    });
    vi.mocked(handleIncomingWebhook).mockResolvedValue({
      accepted: true,
      eventType: "unknown",
      eventId: "de-1",
    });

    const req = new Request("https://test/api/v1/webhooks/incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "evt-2", data: { tenantId: "t1" } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(verifyIncomingWebhook).toHaveBeenCalled();
  });
});
