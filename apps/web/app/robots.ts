import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  const ownerDisallow = routing.locales.map((loc) => `/${loc}/owner`);
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/admin", "/login", "/register", "/owner", ...ownerDisallow],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
