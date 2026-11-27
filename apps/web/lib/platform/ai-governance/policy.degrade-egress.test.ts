import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPolicy } from "./policy.service";
import type { PolicyContext } from "./policy.types";

vi.mock("@/lib/platform/privacy/privacy.service", () => ({
  getPrivacySettings: vi.fn(),
}));

const { getPrivacySettings } = await import("@/lib/platform/privacy/privacy.service");

describe.each(["", "custom-plan"])("egress gates for degraded tier %j", (tier) => {
  const insert = vi.fn();
  const supabase = { from: vi.fn(() => ({ insert })) } as any;
  const context: PolicyContext = {
    tenant_id: "tenant-a",
    subscription_tier: tier,
    resource_type: "media",
    image_count: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AI_INFERENCE_RETENTION_MODE", "ephemeral_no_train_declared");
    vi.stubEnv("AI_REQUIRE_RETENTION_DECLARATION", "true");
    vi.stubEnv("AI_TRUSTED_IMAGE_HOSTS", "trusted.example.com");
    vi.mocked(getPrivacySettings).mockResolvedValue(null);
    insert.mockReturnValue({
      select: () => ({
        single: async () => ({ data: { id: "decision-degrade" }, error: null }),
      }),
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(["blocked", "undeclared"])("blocks and audits retention mode %s", async (mode) => {
    vi.stubEnv("AI_INFERENCE_RETENTION_MODE", mode);
    const result = await runPolicy(supabase, context);
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("retention_undeclared_or_blocked");
    expect(result.rule_hits).toContain("tier_unknown");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ decision: "block" }));
  });

  it("keeps a safe unknown tier degraded with the free model", async () => {
    const result = await runPolicy(supabase, context);
    expect(result.decision).toBe("degrade");
    expect(result.model_tier).toBe("free");
    expect(result.decisionId).toBe("decision-degrade");
  });

  it("blocks secret-shaped text before egress", async () => {
    const syntheticSecret = ["sk", "abcdefghijklmnopqrstuvwxyz012345"].join("-");
    const result = await runPolicy(supabase, { ...context, egress_text: syntheticSecret });
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("secret_detected");
  });

  it.each(["free", tier])("binds the mandate to the policy tenant for tier %j", async (subscriptionTier) => {
    const result = await runPolicy(supabase, {
      ...context,
      subscription_tier: subscriptionTier,
      handoff: {
        mandate: {
          tenantId: "tenant-b", principalId: "user-1", allowedRecipients: ["agent-a"],
          classification: "restricted", purpose: "draft",
        },
        hops: [{
          agentId: "agent-a", tenantId: "tenant-b", action: "summarize",
          destination: "same_tenant_ops", recipients: ["agent-a"],
        }],
      },
    });
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("mandate_tenant_mismatch");
    expect(result.rule_hits).not.toContain("transitive_allow");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: "tenant-a", decision: "block",
      rule_hits: expect.arrayContaining(["mandate_tenant_mismatch"]),
    }));
  });

  it.each(["image_url", "video_url"] as const)("enforces strict PII host policy for %s", async (field) => {
    vi.mocked(getPrivacySettings).mockResolvedValue({
      pii_mode: "strict", redact_ai_prompts: false, allow_exports: true,
    });
    const result = await runPolicy(supabase, {
      ...context, [field]: "https://untrusted.example.com/private-media",
    });
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("pii_strict_untrusted_image_host");
  });

  it.each([
    ["tenant-b", "block", "cross_tenant_handoff"],
    ["tenant-a", "degrade", "transitive_allow"],
  ])("checks handoff to %s without upgrading the original decision", async (tenantId, decision, hit) => {
    const result = await runPolicy(supabase, {
      ...context,
      handoff: {
        mandate: {
          tenantId: "tenant-a", principalId: "user-1", allowedRecipients: ["agent-a"],
          classification: "restricted", purpose: "draft",
        },
        hops: [{ agentId: "agent-a", tenantId, action: "summarize", destination: "same_tenant_ops" }],
      },
    });
    expect(result.decision).toBe(decision);
    expect(result.rule_hits).toContain(hit);
  });
});
