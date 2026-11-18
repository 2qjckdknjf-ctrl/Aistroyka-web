import { describe, expect, it } from "vitest";
import { mergeFirstTouchAttribution, sanitizeLeadAttribution } from "./lead-attribution";

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

  it("does not copy email or other PII fields into attribution", () => {
    const clean = sanitizeLeadAttribution({
      utm_source: "google",
      email: "person@example.com",
      name: "Jane",
    } as Record<string, unknown>);
    expect(clean.utm_source).toBe("google");
    expect(JSON.stringify(clean)).not.toContain("person@example.com");
    expect(JSON.stringify(clean)).not.toContain("Jane");
  });
});

describe("mergeFirstTouchAttribution", () => {
  it("keeps first-touch UTM and landing page across later internal navigations", () => {
    const first = sanitizeLeadAttribution({
      utm_source: "google",
      utm_campaign: "spain",
      landing_page: "/en?utm_campaign=spain",
      referrer: "https://www.google.com/",
    });
    const later = sanitizeLeadAttribution({
      landing_page: "/en/pricing",
    });
    const merged = mergeFirstTouchAttribution(later, first);
    expect(merged.utm_source).toBe("google");
    expect(merged.utm_campaign).toBe("spain");
    expect(merged.landing_page).toBe("/en?utm_campaign=spain");
    expect(merged.referrer).toBe("https://www.google.com/");
  });
});
