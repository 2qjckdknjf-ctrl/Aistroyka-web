import { describe, expect, it } from "vitest";
import {
  SELF_SERVE_PLAN_IDS,
  buildPaidPlanCtaText,
  enterpriseDetailPath,
  formatPlanPrice,
  getCheckoutPlanKey,
  getPublicPlan,
  getPublicPlans,
  getSelfServePlans,
  isPublicPlanId,
  legacyEnterprisePath,
  localizedPublicPath,
  lookupPublicPlan,
  paidPlanCtaContainsPrice,
  subscribePath,
} from "./pricing-catalog";

describe("pricing catalog completeness", () => {
  it("includes Starter, Pro, Business and Enterprise", () => {
    expect(getPublicPlans().map((plan) => plan.id)).toEqual(["starter", "pro", "business", "enterprise"]);
  });

  it("gives every self-serve plan a monthly amount and Stripe checkout key", () => {
    for (const id of SELF_SERVE_PLAN_IDS) {
      const plan = getPublicPlan(id);
      expect(plan.checkoutEnabled).toBe(true);
      if (!plan.checkoutEnabled) continue;
      expect(plan.monthlyAmount).toBeGreaterThan(0);
      expect(plan.checkoutPlanKey).toMatch(/^(starter|business)$/);
    }
  });

  it("does not invent a Business or Enterprise list price", () => {
    expect(getPublicPlan("business").monthlyAmount).toBeNull();
    expect(getPublicPlan("enterprise").monthlyAmount).toBeNull();
    expect(getPublicPlan("business").checkoutEnabled).toBe(false);
    expect(getPublicPlan("enterprise").checkoutEnabled).toBe(false);
  });
});

describe("formatted price in each paid-plan CTA", () => {
  it("embeds the catalog price in Starter and Pro CTAs", () => {
    for (const plan of getSelfServePlans()) {
      const formattedPrice = formatPlanPrice(plan, "en");
      expect(formattedPrice).toMatch(/49|149/);
      const cta = buildPaidPlanCtaText({
        chooseLabel: "Choose",
        planName: plan.name,
        formattedPrice,
        perUnit: "mo",
      });
      expect(paidPlanCtaContainsPrice(cta, formattedPrice)).toBe(true);
      expect(cta).not.toMatch(/\{|ЦЕНА/);
    }
  });
});

describe("pricing → checkout plan mapping", () => {
  it("maps public ids onto existing Stripe plan_key values", () => {
    expect(getCheckoutPlanKey("starter")).toBe("starter");
    expect(getCheckoutPlanKey("pro")).toBe("business");
    expect(getCheckoutPlanKey("business")).toBeNull();
    expect(getCheckoutPlanKey("enterprise")).toBeNull();
  });

  it("builds subscribe URLs with the public plan id only", () => {
    expect(subscribePath("ru", "starter")).toBe("/ru/subscribe?plan=starter");
    expect(subscribePath("en", "pro")).toBe("/en/subscribe?plan=pro");
  });
});

describe("server-side price lookup", () => {
  it("resolves plans from a trusted catalog and ignores unknown or priced query values", () => {
    expect(lookupPublicPlan("pro")?.id).toBe("pro");
    expect(lookupPublicPlan("PRO")?.id).toBe("pro");
    expect(lookupPublicPlan("enterprise")?.monthlyAmount).toBeNull();
    expect(lookupPublicPlan("gold")).toBeNull();
    expect(lookupPublicPlan({ id: "starter", monthlyAmount: 1 })).toBeNull();
    expect(lookupPublicPlan("starter?amount=1")).toBeNull();
    expect(isPublicPlanId("starter")).toBe(true);
    expect(isPublicPlanId("team")).toBe(false);
  });

  it("never trusts a client-supplied amount over the catalog", () => {
    const starter = lookupPublicPlan("starter");
    expect(starter && starter.checkoutEnabled ? starter.monthlyAmount : null).toBe(49);
    const forged = lookupPublicPlan("starter&monthlyAmount=1");
    expect(forged).toBeNull();
  });
});

describe("Enterprise routing and locale links", () => {
  it("sends Enterprise to the pricing detail route, not checkout", () => {
    expect(enterpriseDetailPath("ru")).toBe("/ru/pricing/enterprise");
    expect(legacyEnterprisePath("en")).toBe("/en/enterprise");
    expect(getCheckoutPlanKey("enterprise")).toBeNull();
  });

  it("prefixes public paths with the active locale", () => {
    expect(localizedPublicPath("ru", "/")).toBe("/ru");
    expect(localizedPublicPath("es", "/pricing")).toBe("/es/pricing");
    expect(localizedPublicPath("it", "features")).toBe("/it/features");
  });
});
