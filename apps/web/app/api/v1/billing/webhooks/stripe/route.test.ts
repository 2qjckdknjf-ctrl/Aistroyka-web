import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));

vi.mock("@/lib/platform/billing-readiness/stripe-webhook-ingress.service", () => ({
  ingestStripeWebhook: vi.fn(),
}));

vi.mock("@/lib/platform/billing-readiness/billing-provider-config", () => ({
  getStripeWebhookIngressConfig: vi.fn(),
}));

const { getAdminClient } = await import("@/lib/supabase/admin");
const { ingestStripeWebhook } = await import("@/lib/platform/billing-readiness/stripe-webhook-ingress.service");
const { getStripeWebhookIngressConfig } = await import("@/lib/platform/billing-readiness/billing-provider-config");

describe("POST /api/v1/billing/webhooks/stripe (Step 17)", () => {
  const mockAdmin = {};

  beforeEach(() => {
    vi.mocked(getAdminClient).mockReturnValue(mockAdmin as never);
    vi.mocked(getStripeWebhookIngressConfig).mockReturnValue({
      enabled: true,
      webhookSecretValid: true,
      reason: "ready",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when admin client unavailable", async () => {
    vi.mocked(getAdminClient).mockReturnValue(null);
    const { POST } = await import("./route");
    const res = await POST(new Request("https://x/webhooks/stripe", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
  });

  it("returns 503 when webhook ingress disabled", async () => {
    vi.mocked(getStripeWebhookIngressConfig).mockReturnValue({
      enabled: false,
      webhookSecretValid: false,
      reason: "not enabled",
    });
    const { POST } = await import("./route");
    const res = await POST(new Request("https://x/webhooks/stripe", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
  });

  it("returns 503 when webhook secret invalid", async () => {
    vi.mocked(getStripeWebhookIngressConfig).mockReturnValue({
      enabled: true,
      webhookSecretValid: false,
      reason: "secret missing",
    });
    const { POST } = await import("./route");
    const res = await POST(new Request("https://x/webhooks/stripe", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
  });

  it("returns 400 when signature invalid", async () => {
    vi.mocked(ingestStripeWebhook).mockResolvedValue({ status: "rejected", reason: "Invalid signature" });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("https://x/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "bad" },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 when duplicate", async () => {
    vi.mocked(ingestStripeWebhook).mockResolvedValue({ status: "duplicate", eventId: "evt-1" });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("https://x/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "sig" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("returns 200 when processed", async () => {
    vi.mocked(ingestStripeWebhook).mockResolvedValue({
      status: "processed",
      eventId: "evt-1",
      processingStatus: "processed",
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("https://x/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "sig" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(body.eventId).toBe("evt-1");
  });

  it("returns 200 when skipped (unsupported event)", async () => {
    vi.mocked(ingestStripeWebhook).mockResolvedValue({
      status: "skipped",
      reason: "Unsupported event type",
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("https://x/webhooks/stripe", {
        method: "POST",
        body: "{}",
        headers: { "stripe-signature": "sig" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(body.skipped).toBeDefined();
  });
});
