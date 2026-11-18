import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";
import { buildPublicSitemapEntries } from "@/lib/seo/public-sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildPublicSitemapEntries({
    origin: getAppUrl(),
    locales: routing.locales,
    defaultLocale: routing.defaultLocale,
  });
}
