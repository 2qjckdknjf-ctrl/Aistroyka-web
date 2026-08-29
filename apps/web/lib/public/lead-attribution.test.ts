import { describe, expect, it } from "vitest";
import { sanitizeLeadAttribution } from "./lead-attribution";

describe("sanitizeLeadAttribution", () => {
  it("keeps utm fields and drops javascript URLs", () => {
    const clean = sanitizeLeadAttribution({
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: "spain",
      landing_page: "/en/pricing?utm_source=google",
      referrer: "javascript:alert(1)",
      locale: "en",
    });
    expect(clean.utm_source).toBe("google");
    expect(clean.referrer).toBeNull();
    expect(clean.locale).toBe("en");
  });
});
