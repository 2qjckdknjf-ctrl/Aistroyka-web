import { describe, expect, it } from "vitest";
import { buildPublicPageMetadata } from "./public-page-metadata";

describe("buildPublicPageMetadata", () => {
  it("sets canonical and hreflang alternates for a public path", () => {
    const meta = buildPublicPageMetadata("en", "/security", {
      title: "Security",
      description: "Security posture",
    });

    expect(meta.alternates?.canonical).toMatch(/\/en\/security$/);
    expect(meta.alternates?.languages).toMatchObject({
      en: expect.stringMatching(/\/en\/security$/),
      ru: expect.stringMatching(/\/ru\/security$/),
      es: expect.stringMatching(/\/es\/security$/),
      it: expect.stringMatching(/\/it\/security$/),
    });
    expect(meta.openGraph?.url).toMatch(/\/en\/security$/);
    expect(meta.twitter?.title).toBe("Security");
  });

  it("supports absolute home titles", () => {
    const meta = buildPublicPageMetadata("ru", "", {
      titleAbsolute: "Aistroyka — Home",
      description: "Home description",
    });

    expect(meta.title).toEqual({ absolute: "Aistroyka — Home" });
    expect(meta.alternates?.canonical).toMatch(/\/ru$/);
  });
});
