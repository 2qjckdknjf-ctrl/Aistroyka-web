import type { MetadataRoute } from "next";
import { publicCanonicalUrl, publicLocaleAlternates } from "@/lib/seo/public-canonical";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-paths";

export function buildPublicSitemapEntries(input: {
  origin: string;
  locales: readonly string[];
  defaultLocale: string;
}): MetadataRoute.Sitemap {
  const origin = input.origin.replace(/\/+$/, "");
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of input.locales) {
    for (const path of PUBLIC_SITEMAP_PATHS) {
      const pathname = path ? `/${locale}${path}` : `/${locale}`;
      const url = publicCanonicalUrl({ origin, pathname });
      entries.push({
        url,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
        alternates: {
          languages: publicLocaleAlternates({
            origin,
            pathname,
            locales: input.locales,
            defaultLocale: input.defaultLocale,
          }),
        },
      });
    }
  }
  return entries;
}
