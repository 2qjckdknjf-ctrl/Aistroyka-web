import type { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";

const OPEN_GRAPH_LOCALE: Record<(typeof routing.locales)[number], string> = {
  en: "en_US",
  ru: "ru_RU",
  es: "es_ES",
  it: "it_IT",
};

export type PublicPageMetadataInput = {
  title?: string;
  titleAbsolute?: string;
  description: string;
};

function normalizePublicPath(path: string): string {
  if (path === "") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

/** Locale-aware metadata for public marketing routes: canonical, hreflang, OG, Twitter. */
export function buildPublicPageMetadata(
  locale: string,
  path: string,
  input: PublicPageMetadataInput,
): Metadata {
  const base = getAppUrl();
  const normalizedPath = normalizePublicPath(path);
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${base}/${loc}${normalizedPath}`;
  }

  const canonical = `${base}/${locale}${normalizedPath}`;
  const ogTitle = input.titleAbsolute ?? input.title ?? "Aistroyka";

  return {
    title: input.titleAbsolute ? { absolute: input.titleAbsolute } : input.title,
    description: input.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: ogTitle,
      description: input.description,
      url: canonical,
      locale: OPEN_GRAPH_LOCALE[locale as (typeof routing.locales)[number]] ?? locale,
      alternateLocale: routing.locales
        .filter((loc) => loc !== locale)
        .map((loc) => OPEN_GRAPH_LOCALE[loc]),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: input.description,
    },
  };
}
