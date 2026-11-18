/** Shared public Open Graph fields. Next.js replaces nested `openGraph` objects instead of merging them. */

export const AISTROYKA_OG_IMAGE = {
  url: "/brand/social/aistroyka-og.png",
  width: 1200,
  height: 630,
  alt: "AISTROYKA",
} as const;

export type OpenGraphLocale = "ru_RU" | "en_US" | "es_ES" | "it_IT";

export function openGraphLocale(locale: string): OpenGraphLocale {
  switch (locale) {
    case "ru":
      return "ru_RU";
    case "en":
      return "en_US";
    case "es":
      return "es_ES";
    case "it":
      return "it_IT";
    default:
      throw new Error(`unsupported public locale: ${locale}`);
  }
}

export function publicOpenGraph(input: {
  locale: string;
  canonical: string;
  title?: string;
  description?: string;
}): {
  type: "website";
  locale: OpenGraphLocale;
  url: string;
  siteName: "Aistroyka";
  images: Array<{ url: string; width: number; height: number; alt: string }>;
  title?: string;
  description?: string;
} {
  return {
    type: "website",
    locale: openGraphLocale(input.locale),
    url: input.canonical,
    siteName: "Aistroyka",
    images: [
      {
        url: AISTROYKA_OG_IMAGE.url,
        width: AISTROYKA_OG_IMAGE.width,
        height: AISTROYKA_OG_IMAGE.height,
        alt: AISTROYKA_OG_IMAGE.alt,
      },
    ],
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
  };
}
