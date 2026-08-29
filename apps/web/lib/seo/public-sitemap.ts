import type { MetadataRoute } from "next";
import { publicCanonicalUrl } from "@/lib/seo/public-canonical";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-paths";

/** Inventory-only sitemap. hreflang is HTTP Link (next-intl), not this file.
 * Google treats HTML / HTTP Link / sitemap as equivalent — pick one primary.
 * `changefreq` and `priority` are ignored by Google and Bing; lastmod is omitted unless per-URL accurate.
 */
export function buildPublicSitemapEntries(input: {
  origin: string;
  locales: readonly string[];
  defaultLocale: string;
}): MetadataRoute.Sitemap {
  if (!input.locales.includes(input.defaultLocale)) {
    throw new Error("defaultLocale must be one of the public locales");
  }
  const origin = input.origin.replace(/\/+$/, "");
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of input.locales) {
    for (const path of PUBLIC_SITEMAP_PATHS) {
      const pathname = path ? `/${locale}${path}` : `/${locale}`;
      entries.push({
        url: publicCanonicalUrl({ origin, pathname }),
      });
    }
  }
  return entries;
}
