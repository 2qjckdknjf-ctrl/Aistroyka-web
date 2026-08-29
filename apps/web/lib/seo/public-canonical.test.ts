import { describe, expect, it } from "vitest";
import { canonicalMatchesLocaleSelf, publicCanonicalUrl, publicLocaleAlternates } from "./public-canonical";
import { PUBLIC_PATHS_EXCLUDED_FROM_SITEMAP, PUBLIC_SITEMAP_PATHS } from "./public-paths";
import { buildPublicSitemapEntries } from "./public-sitemap";
import { AISTROYKA_OG_IMAGE, openGraphLocale, publicOpenGraph } from "./public-open-graph";

const ORIGIN = "https://www.aistroyka.ai";
const LOCALES = ["ru", "en", "es", "it"] as const;

describe("publicCanonicalUrl", () => {
  it("builds a self-referencing HTTPS URL without query strings", () => {
    expect(publicCanonicalUrl({ origin: `${ORIGIN}/`, pathname: "/en/pricing?utm=1" })).toBe(
      `${ORIGIN}/en/pricing`,
    );
  });

  it("keeps localized paths canonical to themselves", () => {
    expect(publicCanonicalUrl({ origin: ORIGIN, pathname: "/ru/solutions" })).toBe(`${ORIGIN}/ru/solutions`);
    expect(publicCanonicalUrl({ origin: ORIGIN, pathname: "/es" })).toBe(`${ORIGIN}/es`);
  });

  it("covers homepage, locale home, solution, pricing, legal, nested, and query routes", () => {
    const samples = [
      ["/", `${ORIGIN}/`],
      ["/en", `${ORIGIN}/en`],
      ["/es/solutions", `${ORIGIN}/es/solutions`],
      ["/ru/pricing?utm_source=google", `${ORIGIN}/ru/pricing`],
      ["/it/privacy", `${ORIGIN}/it/privacy`],
      ["/en/docs/getting-started", `${ORIGIN}/en/docs/getting-started`],
      ["/en/contact?ref=nav#form", `${ORIGIN}/en/contact`],
    ] as const;
    for (const [pathname, expected] of samples) {
      expect(publicCanonicalUrl({ origin: ORIGIN, pathname })).toBe(expected);
      expect(
        canonicalMatchesLocaleSelf({
          canonical: expected,
          origin: ORIGIN,
          pathname,
        }),
      ).toBe(true);
    }
  });

  it("does not collapse one locale onto another", () => {
    const enHome = publicCanonicalUrl({ origin: ORIGIN, pathname: "/en" });
    const ruHome = publicCanonicalUrl({ origin: ORIGIN, pathname: "/ru" });
    expect(enHome).not.toBe(ruHome);
    expect(
      canonicalMatchesLocaleSelf({
        canonical: enHome,
        origin: ORIGIN,
        pathname: "/ru",
      }),
    ).toBe(false);
  });

  it("strips trailing slashes except the origin root", () => {
    expect(publicCanonicalUrl({ origin: ORIGIN, pathname: "/" })).toBe(`${ORIGIN}/`);
    expect(
      canonicalMatchesLocaleSelf({
        canonical: `${ORIGIN}/en/docs/getting-started`,
        origin: ORIGIN,
        pathname: "/en/docs/getting-started/",
      }),
    ).toBe(true);
  });

  it("emits per-locale hreflang plus x-default without cross-locale collapse", () => {
    const languages = publicLocaleAlternates({
      origin: ORIGIN,
      pathname: "/es/pricing?utm=1",
      locales: LOCALES,
      defaultLocale: "ru",
    });
    expect(languages.en).toBe(`${ORIGIN}/en/pricing`);
    expect(languages.ru).toBe(`${ORIGIN}/ru/pricing`);
    expect(languages.es).toBe(`${ORIGIN}/es/pricing`);
    expect(languages.it).toBe(`${ORIGIN}/it/pricing`);
    expect(languages["x-default"]).toBe(`${ORIGIN}/ru/pricing`);
    expect(new Set([languages.en, languages.ru, languages.es, languages.it]).size).toBe(4);
  });
});

describe("public sitemap entries", () => {
  it("omits lastmod, ignored ranking folklore, stub paths, and sitemap hreflang", () => {
    const entries = buildPublicSitemapEntries({
      origin: ORIGIN,
      locales: LOCALES,
      defaultLocale: "ru",
    });
    expect(entries.some((entry) => "lastModified" in entry && entry.lastModified != null)).toBe(false);
    expect(entries.some((entry) => entry.changeFrequency != null)).toBe(false);
    expect(entries.some((entry) => entry.priority != null)).toBe(false);
    expect(entries.some((entry) => entry.alternates != null)).toBe(false);
    for (const stub of PUBLIC_PATHS_EXCLUDED_FROM_SITEMAP) {
      expect(entries.some((entry) => entry.url.includes(stub))).toBe(false);
    }
    expect(entries.filter((entry) => entry.url.endsWith("/en/solutions")).length).toBe(1);
    expect(entries.length).toBe(PUBLIC_SITEMAP_PATHS.length * LOCALES.length);
  });
});

describe("public Open Graph", () => {
  it("keeps production image, site name, locale, and canonical URL without English title on localized pages", () => {
    const canonical = `${ORIGIN}/es/solutions`;
    const og = publicOpenGraph({ locale: "es", canonical });
    expect(og.type).toBe("website");
    expect(og.siteName).toBe("Aistroyka");
    expect(og.locale).toBe("es_ES");
    expect(og.url).toBe(canonical);
    expect(og.images[0]?.url).toBe(AISTROYKA_OG_IMAGE.url);
    expect(og.title).toBeUndefined();
    expect(og.description).toBeUndefined();
    expect(openGraphLocale("ru")).toBe("ru_RU");
    expect(openGraphLocale("it")).toBe("it_IT");
  });

  it("attaches localized title and description only when the page supplies them", () => {
    const og = publicOpenGraph({
      locale: "es",
      canonical: `${ORIGIN}/es`,
      title: "Control de obra para negocio, jefes de proyecto y campo",
      description: "Una obra. Tres niveles de control.",
    });
    expect(og.title).toMatch(/obra/);
    expect(og.description).toMatch(/obra/);
    expect(og.images[0]?.url).toBe(AISTROYKA_OG_IMAGE.url);
  });
});
