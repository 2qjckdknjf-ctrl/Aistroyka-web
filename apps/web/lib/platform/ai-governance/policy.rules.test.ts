import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "./policy.rules";

describe("policy.rules", () => {
  it("allows when within limits", () => {
    const r = evaluatePolicy({
      tenant_id: "t1",
      subscription_tier: "PRO",
      resource_type: "media",
      image_count: 5,
      image_size_bytes: 5 * 1024 * 1024,
    });
    expect(r.decision).toBe("allow");
    expect(r.rule_hits).toContain("tier_allow");
  });

  it("blocks when image_count exceeded", () => {
    const r = evaluatePolicy({
      tenant_id: "t1",
      subscription_tier: "FREE",
      image_count: 10,
    });
    expect(r.decision).toBe("block");
    expect(r.rule_hits).toContain("max_image_count_exceeded");
  });

  it("blocks when image_size_bytes exceeded", () => {
    const r = evaluatePolicy({
      tenant_id: "t1",
      subscription_tier: "FREE",
      image_size_bytes: 10 * 1024 * 1024,
    });
    expect(r.decision).toBe("block");
    expect(r.rule_hits).toContain("max_image_size_exceeded");
  });

  it("degrades when tier unknown", () => {
    const r = evaluatePolicy({
      tenant_id: "t1",
      subscription_tier: "UNKNOWN",
    });
    expect(r.decision).toBe("degrade");
    expect(r.rule_hits).toContain("tier_unknown");
  });
});
