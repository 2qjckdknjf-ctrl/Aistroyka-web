import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getBillingAdapter,
  getDefaultBillingAdapter,
  getConfiguredBillingAdapter,
  getBillingAdapterDiagnostics,
} from "./billing-adapter-registry";
import { sandboxBillingAdapter } from "./billing-adapter-sandbox";
import { stripeBillingAdapter } from "./billing-adapter-stripe";

const FLAG = "ENABLE_STRIPE_BILLING_PROVIDER";
const SECRET = "STRIPE_SECRET_KEY";
const WEBHOOK = "STRIPE_WEBHOOK_SECRET";

describe("billing adapter registry", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env[FLAG];
    delete process.env[SECRET];
    delete process.env[WEBHOOK];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("getDefaultBillingAdapter returns sandbox when flag off", () => {
    const adapter = getDefaultBillingAdapter();
    expect(adapter.getProviderKind()).toBe("sandbox");
  });

  it("getConfiguredBillingAdapter returns sandbox when flag off", () => {
    const adapter = getConfiguredBillingAdapter();
    expect(adapter.getProviderKind()).toBe("sandbox");
  });

  it("getConfiguredBillingAdapter returns stripe when flag and config valid", () => {
    process.env[FLAG] = "true";
    process.env[SECRET] = "sk_test_xxx";
    process.env[WEBHOOK] = "whsec_xxx";
    const adapter = getConfiguredBillingAdapter();
    expect(adapter.getProviderKind()).toBe("stripe");
  });

  it("getBillingAdapterDiagnostics returns fallback reason when sandbox", () => {
    const diag = getBillingAdapterDiagnostics();
    expect(diag.activeAdapterKind).toBe("sandbox");
    expect(diag.providerKind).toBe("sandbox");
  });

  it("getBillingAdapter(sandbox) returns sandbox adapter", () => {
    const adapter = getBillingAdapter("sandbox");
    expect(adapter).toBe(sandboxBillingAdapter);
  });

  it("getBillingAdapter(manual) returns sandbox adapter", () => {
    const adapter = getBillingAdapter("manual");
    expect(adapter).toBe(sandboxBillingAdapter);
  });

  it("getBillingAdapter(stripe) returns stripe adapter", () => {
    const adapter = getBillingAdapter("stripe");
    expect(adapter.getProviderKind()).toBe("stripe");
  });

  it("getBillingAdapter(unknown) returns sandbox as fallback", () => {
    const adapter = getBillingAdapter("paddle");
    expect(adapter.getProviderKind()).toBe("sandbox");
  });
});

describe("sandbox adapter", () => {
  it("createCheckoutSession returns no redirect URL", async () => {
    const result = await sandboxBillingAdapter.createCheckoutSession({
      workspaceId: "w1",
      targetPlanCode: "team_contractor",
      requestedBillingCycle: "monthly",
      returnUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel",
      sessionId: "sess-1",
    });
    expect(result.success).toBe(true);
    expect(result.redirectUrl).toBeUndefined();
    expect(result.mode).toBe("sandbox_simulation");
    expect(result.providerSessionRef).toBe("sandbox_sess-1");
  });

  it("translateProviderEvent parses sandbox.checkout.completed", async () => {
    const result = await sandboxBillingAdapter.translateProviderEvent!({
      providerEventRef: "ref-1",
      eventType: "sandbox.checkout.completed",
      payload: { workspaceId: "w1", planCode: "team_contractor" },
    });
    expect(result).not.toBeNull();
    expect(result?.checkoutAction).toBe("complete");
    expect(result?.planCode).toBe("team_contractor");
  });

  it("translateProviderEvent parses sandbox.checkout.cancelled", async () => {
    const result = await sandboxBillingAdapter.translateProviderEvent!({
      providerEventRef: "ref-1",
      eventType: "sandbox.checkout.cancelled",
      payload: { workspaceId: "w1" },
    });
    expect(result).not.toBeNull();
    expect(result?.checkoutAction).toBe("cancel");
  });

  it("translateProviderEvent returns null for non-sandbox event", async () => {
    const result = await sandboxBillingAdapter.translateProviderEvent!({
      providerEventRef: "evt_stripe_123",
      eventType: "customer.subscription.updated",
      payload: {},
    });
    expect(result).toBeNull();
  });
});
