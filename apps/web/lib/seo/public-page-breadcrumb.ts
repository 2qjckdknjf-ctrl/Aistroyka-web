import { getAppUrl } from "@/lib/app-url";

export type PublicBreadcrumbItem = {
  name: string;
  path: string;
};

function normalizePublicPath(path: string): string {
  if (path === "" || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function breadcrumbItemUrl(locale: string, path: string): string {
  const base = getAppUrl();
  const normalized = normalizePublicPath(path);
  return normalized === "" ? `${base}/${locale}` : `${base}/${locale}${normalized}`;
}

/** Schema.org BreadcrumbList for public marketing routes. */
export function buildBreadcrumbListJsonLd(
  locale: string,
  items: readonly PublicBreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: breadcrumbItemUrl(locale, item.path),
    })),
  };
}

/** Home → current page (single-item list on homepage). */
export function buildStandardPublicBreadcrumb(
  locale: string,
  path: string,
  pageName: string,
  homeName: string,
): Record<string, unknown> {
  const normalized = normalizePublicPath(path);
  if (normalized === "") {
    return buildBreadcrumbListJsonLd(locale, [{ name: homeName, path: "" }]);
  }
  return buildBreadcrumbListJsonLd(locale, [
    { name: homeName, path: "" },
    { name: pageName, path: normalized },
  ]);
}
