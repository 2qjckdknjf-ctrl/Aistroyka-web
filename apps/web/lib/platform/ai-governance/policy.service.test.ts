import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPolicy, recordPolicyDecision } from "./policy.service";

vi.mock("@/lib/platform/privacy/privacy.service", () => ({
  getPrivacySettings: vi.fn(),
}));

const { getPrivacySettings } = await import("@/lib/platform/privacy/privacy.service");

describe("policy.service", () => {
  const supabase = {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: "decision-uuid-1" }, error: null }),
        })),
      })),
    })),
  } as any;

  beforeEach(() => {
    vi.mocked(getPrivacySettings).mockResolvedValue(null);
    supabase.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: "decision-uuid-1" }, error: null }),
        })),
      })),
    });
  });

  it("returns allow and decisionId when policy allows", async () => {
    const result = await runPolicy(
      supabase,
      {
        tenant_id: "t1",
        subscription_tier: "free",
        resource_type: "media",
        image_count: 1,
      },
      "trace-1"
    );
    expect(result.decision).toBe("allow");
    expect(result.decisionId).toBe("decision-uuid-1");
    expect(result.rule_hits).toContain("tier_allow");
  });

  it("returns block and decisionId when policy blocks", async () => {
    const result = await runPolicy(
      supabase,
      {
        tenant_id: "t1",
        subscription_tier: "FREE",
        image_count: 10,
      },
      null
    );
    expect(result.decision).toBe("block");
    expect(result.decisionId).toBe("decision-uuid-1");
    expect(result.rule_hits).toContain("max_image_count_exceeded");
  });

  it("blocks on PII strict + untrusted image host when AI_TRUSTED_IMAGE_HOSTS set", async () => {
    const orig = process.env.AI_TRUSTED_IMAGE_HOSTS;
    process.env.AI_TRUSTED_IMAGE_HOSTS = "storage.example.com,cdn.trusted.com";
    vi.mocked(getPrivacySettings).mockResolvedValue({
      pii_mode: "strict",
      redact_ai_prompts: false,
      allow_exports: true,
    });
    const result = await runPolicy(
      supabase,
      {
        tenant_id: "t1",
        subscription_tier: "free",
        resource_type: "media",
        image_count: 1,
        image_url: "https://untrusted.com/image.jpg",
      },
      null
    );
    process.env.AI_TRUSTED_IMAGE_HOSTS = orig;
    expect(result.decision).toBe("block");
    expect(result.rule_hits).toContain("pii_strict_untrusted_image_host");
  });

  it("allows when PII strict but trusted host", async () => {
    const orig = process.env.AI_TRUSTED_IMAGE_HOSTS;
    process.env.AI_TRUSTED_IMAGE_HOSTS = "storage.example.com";
    vi.mocked(getPrivacySettings).mockResolvedValue({
      pii_mode: "strict",
      redact_ai_prompts: false,
      allow_exports: true,
    });
    const result = await runPolicy(
      supabase,
      {
        tenant_id: "t1",
        subscription_tier: "free",
        resource_type: "media",
        image_count: 1,
        image_url: "https://storage.example.com/photo.jpg",
      },
      null
    );
    process.env.AI_TRUSTED_IMAGE_HOSTS = orig;
    expect(result.decision).toBe("allow");
  });

  it("recordPolicyDecision returns inserted id", async () => {
    const id = await recordPolicyDecision(
      supabase,
      "t1",
      "allow",
      ["tier_allow"],
      "trace-1"
    );
    expect(id).toBe("decision-uuid-1");
    expect(supabase.from).toHaveBeenCalledWith("ai_policy_decisions");
  });
});
