import { describe, expect, it } from "vitest";
import { canonicalMatchesLocaleSelf, publicCanonicalUrl } from "./public-canonical";

describe("publicCanonicalUrl", () => {
  it("builds a self-referencing HTTPS URL without query strings", () => {
    expect(publicCanonicalUrl({ origin: "https://www.aistroyka.ai/", pathname: "/en/pricing?utm=1" })).toBe(
      "https://www.aistroyka.ai/en/pricing",
    );
  });

  it("keeps localized paths canonical to themselves", () => {
    expect(publicCanonicalUrl({ origin: "https://www.aistroyka.ai", pathname: "/ru/solutions" })).toBe(
      "https://www.aistroyka.ai/ru/solutions",
    );
    expect(publicCanonicalUrl({ origin: "https://www.aistroyka.ai", pathname: "/es" })).toBe(
      "https://www.aistroyka.ai/es",
    );
  });

  it("strips trailing slashes except the origin root", () => {
    expect(publicCanonicalUrl({ origin: "https://www.aistroyka.ai", pathname: "/" })).toBe(
      "https://www.aistroyka.ai/",
    );
    expect(
      canonicalMatchesLocaleSelf({
        canonical: "https://www.aistroyka.ai/en/docs/getting-started",
        origin: "https://www.aistroyka.ai",
        pathname: "/en/docs/getting-started/",
      }),
    ).toBe(true);
  });
});
