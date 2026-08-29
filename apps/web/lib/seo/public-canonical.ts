export function publicCanonicalUrl(input: { origin: string; pathname: string }): string {
  const origin = input.origin.replace(/\/+$/, "");
  const pathOnly = input.pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = pathOnly === "/" ? "/" : pathOnly.replace(/\/+$/, "") || "/";
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${origin}${withSlash}`;
}

export function publicPathWithoutLocale(pathname: string): string {
  const pathOnly = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const stripped = pathOnly.replace(/^\/(en|ru|es|it)(?=\/|$)/, "") || "/";
  const normalized = stripped === "/" ? "/" : stripped.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function publicLocaleAlternates(input: {
  origin: string;
  pathname: string;
  locales: readonly string[];
  defaultLocale: string;
}): Record<string, string> {
  const rest = publicPathWithoutLocale(input.pathname);
  const restPart = rest === "/" ? "" : rest;
  const languages: Record<string, string> = {};
  for (const locale of input.locales) {
    languages[locale] = publicCanonicalUrl({
      origin: input.origin,
      pathname: `/${locale}${restPart}`,
    });
  }
  languages["x-default"] = publicCanonicalUrl({
    origin: input.origin,
    pathname: `/${input.defaultLocale}${restPart}`,
  });
  return languages;
}

export function canonicalMatchesLocaleSelf(input: {
  canonical: string;
  origin: string;
  pathname: string;
}): boolean {
  return input.canonical === publicCanonicalUrl({ origin: input.origin, pathname: input.pathname });
}
