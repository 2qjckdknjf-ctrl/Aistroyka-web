export function publicCanonicalUrl(input: { origin: string; pathname: string }): string {
  const origin = input.origin.replace(/\/+$/, "");
  const pathOnly = input.pathname.split("?")[0]?.split("#")[0] ?? "/";
  const normalized = pathOnly === "/" ? "/" : pathOnly.replace(/\/+$/, "") || "/";
  const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${origin}${withSlash}`;
}

export function canonicalMatchesLocaleSelf(input: {
  canonical: string;
  origin: string;
  pathname: string;
}): boolean {
  return input.canonical === publicCanonicalUrl({ origin: input.origin, pathname: input.pathname });
}
