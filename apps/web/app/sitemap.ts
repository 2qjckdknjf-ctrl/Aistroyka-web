import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";

const PUBLIC_PATHS = [
  "",
  "/features",
  "/solutions",
  "/ai-construction-control",
  "/ai-demo",
  "/mobile",
  "/pricing",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/cases",
  "/cases/residential",
  "/cases/commercial",
  "/cases/infrastructure",
  "/cases/renovation",
  "/docs",
  "/docs/getting-started",
  "/docs/projects",
  "/docs/tasks",
  "/docs/reports",
  "/docs/ai-analytics",
  "/docs/mobile-apps",
  "/docs/users-and-roles",
  "/projects-showcase",
  "/platform",
  "/security",
  "/copilot",
  "/integrations",
  "/api",
  "/workflows",
  "/enterprise",
  "/implementation",
  "/partners",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of PUBLIC_PATHS) {
      const url = path ? `/${locale}${path}` : `/${locale}`;
      entries.push({
        url: `${base}${url}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
      });
    }
  }
  return entries;
}
