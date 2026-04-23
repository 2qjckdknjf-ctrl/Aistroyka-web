import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { __clearStripePriceCache } from "./stripe-price-mapping";

const mockCreate = vi.hoisted(() => vi.fn());
vi.mock("stripe", () => {
  const create = mockCreate;
  function MockStripe() {
    return {
      checkout: {
        sessions: {
          create,
        },
      },
    };
  }
  return { default: MockStripe };
});

const { stripeBillingAdapter, STRIPE_EVENT_TYPES } = await import("./billing-adapter-stripe");

const FLAG = "ENABLE_STRIPE_BILLING_PROVIDER";
const LIVE_FLAG = "ENABLE_STRIPE_LIVE_CHECKOUT";
const SECRET = "STRIPE_SECRET_KEY";
const WEBHOOK = "STRIPE_WEBHOOK_SECRET";
const PRICE_ENV = "STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY";

describe("stripe billing adapter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env[FLAG];
    delete process.env[SECRET];
    delete process.env[WEBHOOK];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getProviderKind", () => {
    it("returns stripe", () => {
      expect(stripeBillingAdapter.getProviderKind()).toBe("stripe");
    });
  });

  describe("createCheckoutSession", () => {
    it("returns provider_disabled_fallback when not configured", async () => {
      const result = await stripeBillingAdapter.createCheckoutSession({
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        returnUrl: "https://a.com",
        cancelUrl: "https://a.com",
        sessionId: "sess-1",
      });
      expect(result.success).toBe(false);
      expect(result.mode).toBe("provider_disabled_fallback");
      expect(result.message).toBeDefined();
    });

    it("returns provider_ready_stub when configured but live off", async () => {
      process.env[FLAG] = "true";
      process.env[SECRET] = "sk_test_xxx";
      process.env[WEBHOOK] = "whsec_xxx";
      const result = await stripeBillingAdapter.createCheckoutSession({
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        returnUrl: "https://a.com",
        cancelUrl: "https://a.com",
        sessionId: "sess-1",
      });
      expect(result.success).toBe(true);
      expect(result.mode).toBe("provider_ready_stub");
      expect(result.redirectUrl).toBeNull();
    });

    it("returns provider_disabled_fallback when live on but price mapping missing", async () => {
      process.env[FLAG] = "true";
      process.env[LIVE_FLAG] = "true";
      process.env[SECRET] = "sk_test_xxx";
      process.env[WEBHOOK] = "whsec_xxx";
      delete process.env[PRICE_ENV];
      const result = await stripeBillingAdapter.createCheckoutSession({
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        returnUrl: "https://a.com",
        cancelUrl: "https://a.com",
        sessionId: "sess-1",
      });
      expect(result.success).toBe(false);
      expect(result.mode).toBe("provider_disabled_fallback");
      expect(result.message).toContain("Missing");
    });

    it("returns provider_live_checkout when live on and price configured", async () => {
      __clearStripePriceCache();
      process.env[FLAG] = "true";
      process.env[LIVE_FLAG] = "true";
      process.env[SECRET] = "sk_test_xxx";
      process.env[WEBHOOK] = "whsec_xxx";
      process.env[PRICE_ENV] = "price_test_xxx";
      mockCreate.mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/xxx",
      });
      const result = await stripeBillingAdapter.createCheckoutSession({
        workspaceId: "w1",
        targetPlanCode: "team_contractor",
        requestedBillingCycle: "monthly",
        returnUrl: "https://a.com/return",
        cancelUrl: "https://a.com/cancel",
        sessionId: "sess-1",
      });
      expect(result.success).toBe(true);
      expect(result.mode).toBe("provider_live_checkout");
      expect(result.redirectUrl).toBe("https://checkout.stripe.com/xxx");
      expect(result.providerSessionRef).toBe("cs_test_123");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          success_url: "https://a.com/return",
          cancel_url: "https://a.com/cancel",
          metadata: expect.objectContaining({
            workspace_id: "w1",
            target_plan_code: "team_contractor",
            internal_checkout_session_id: "sess-1",
          }),
        })
      );
    });
  });

  describe("translateProviderEvent", () => {
    beforeEach(() => {
      process.env[FLAG] = "true";
      process.env[SECRET] = "sk_test_xxx";
      process.env[WEBHOOK] = "whsec_xxx";
    });

    it("translates checkout.session.completed to checkout_complete", async () => {
      const payload = {
        id: "evt_123",
        type: STRIPE_EVENT_TYPES.CHECKOUT_COMPLETED,
        data: {
          object: {
            id: "cs_test_xxx",
            metadata: { workspace_id: "w1", plan_code: "team_contractor", billing_cycle: "monthly" },
          },
        },
      };
      const result = await stripeBillingAdapter.translateProviderEvent!({
        providerEventRef: "evt_123",
        eventType: STRIPE_EVENT_TYPES.CHECKOUT_COMPLETED,
        payload,
      });
      expect(result).not.toBeNull();
      expect(result?.checkoutAction).toBe("complete");
      expect(result?.planCode).toBe("team_contractor");
      expect(result?.sessionId).toBe("cs_test_xxx");
      expect(result?.workspaceId).toBe("w1");
    });

    it("translates checkout.session.expired to checkout_cancel", async () => {
      const payload = {
        data: { object: { id: "cs_expired", metadata: { workspace_id: "w1" } } },
      };
      const result = await stripeBillingAdapter.translateProviderEvent!({
        providerEventRef: "evt_456",
        eventType: STRIPE_EVENT_TYPES.CHECKOUT_EXPIRED,
        payload,
      });
      expect(result).not.toBeNull();
      expect(result?.checkoutAction).toBe("cancel");
      expect(result?.sessionId).toBe("cs_expired");
    });

    it("translates customer.subscription.deleted to subscription_cancel", async () => {
      const payload = {
        data: { object: { metadata: { workspace_id: "w1" } } },
      };
      const result = await stripeBillingAdapter.translateProviderEvent!({
        providerEventRef: "evt_789",
        eventType: STRIPE_EVENT_TYPES.SUBSCRIPTION_DELETED,
        payload,
      });
      expect(result).not.toBeNull();
      expect(result?.subscriptionAction).toBe("cancel");
      expect(result?.workspaceId).toBe("w1");
    });

    it("translates customer.subscription.deleted with providerSubscriptionRef when workspace unknown (Step 17)", async () => {
      const payload = {
        data: { object: { id: "sub_xxx" } },
      };
      const result = await stripeBillingAdapter.translateProviderEvent!({
        providerEventRef: "evt_789",
        eventType: STRIPE_EVENT_TYPES.SUBSCRIPTION_DELETED,
        payload,
      });
      expect(result).not.toBeNull();
      expect(result?.subscriptionAction).toBe("cancel");
      expect(result?.providerSubscriptionRef).toBe("sub_xxx");
    });

    it("returns null for unsupported event type", async () => {
      const result = await stripeBillingAdapter.translateProviderEvent!({
        providerEventRef: "evt_xxx",
        eventType: "unknown.event.type",
        payload: {},
      });
      expect(result).toBeNull();
    });
  });
});
