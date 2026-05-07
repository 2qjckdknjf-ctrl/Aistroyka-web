import { routing } from "@/i18n/routing";

const DEFAULT_HEADER_CANDIDATES = ["x-next-intl-locale", "x-handover-pack-locale"] as const;

/**
 * Locale for server-built API payloads (next-intl). Query `?locale=` wins; then optional headers.
 */
export function resolveRequestLocale(request: Request, headerCandidates: readonly string[] = DEFAULT_HEADER_CANDIDATES): string {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("locale")?.toLowerCase().split("-")[0];
  let fromHeader: string | undefined;
  for (const name of headerCandidates) {
    const v = request.headers.get(name)?.toLowerCase().split("-")[0];
    if (v) {
      fromHeader = v;
      break;
    }
  }
  const locales = routing.locales as readonly string[];
  for (const c of [fromQuery, fromHeader, routing.defaultLocale]) {
    if (c && locales.includes(c)) return c;
  }
  return routing.defaultLocale;
}
