import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";

/** Cabinet, auth and service paths; each is disallowed bare and under every locale prefix. */
export const ROBOTS_PRIVATE_PATHS = [
  "/dashboard",
  "/admin",
  "/owner",
  "/platform-admin",
  "/portal",
  "/portfolio",
  "/projects/",
  "/billing",
  "/team",
  "/subscribe",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/telegram",
  "/invite",
  "/share",
  "/smoke",
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  const localized = routing.locales.flatMap((loc) => ROBOTS_PRIVATE_PATHS.map((path) => `/${loc}${path}`));
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...ROBOTS_PRIVATE_PATHS, ...localized],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
