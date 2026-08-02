/** Phase 3A — source-derived constants from `app/[locale]/(public)` + middleware gates. */

export const LOCALES = ["ru", "en", "es", "it"] as const;
export type Locale = (typeof LOCALES)[number];

/** Static public routes (no dynamic `[slug]` fixtures invented). */
export const STATIC_PUBLIC_ROUTES = [
  "",
  "about",
  "pricing",
  "features",
  "contact",
  "security",
  "faq",
  "docs",
  "copilot",
  "mobile",
  "platform",
  "solutions",
  "cases",
  "workflows",
  "integrations",
  "enterprise",
  "partners",
  "implementation",
  "privacy",
  "terms",
  "ai-demo",
  "ai-construction-control",
  "api",
  "projects-showcase",
] as const;

export const AUTH_ENTRY_ROUTES = ["login", "register"] as const;

/**
 * Guest-gated protected surfaces from middleware `PROTECTED_PREFIXES`
 * plus platform-admin/owner via `isPlatformAdminPagePath`.
 */
export const PROTECTED_GUEST_PATHS = [
  "/dashboard",
  "/dashboard/",
  "/dashboard/projects",
  "/admin",
  "/admin/",
  "/portal",
  "/portal/",
  "/projects",
  "/billing",
  "/portfolio",
  "/subscribe",
  "/owner",
  "/owner/",
  "/platform-admin",
  "/platform-admin/",
  "/platform-admin/testing",
] as const;

/** Suspicious public marketing claim patterns (claims audit). */
export const SUSPICIOUS_CLAIM_PATTERNS = [
  /MOCK_METRICS/i,
  /\b500\+\b/,
  /\b12K\+\b/,
  /\b99(?:\.9)?%\s*(?:accuracy|savings|uptime)/i,
  /\bfully\s+ready\b/i,
  /\bproduction[- ]ready\b/i,
  /\bpilot\s+launch\s+complete\b/i,
  /\blive\s+customer\s+count\b/i,
];

export function localePath(locale: string, suffix: string): string {
  const clean = suffix.startsWith("/") ? suffix : `/${suffix}`;
  if (clean === "/") return `/${locale}`;
  return `/${locale}${clean}`;
}

export function isFrameworkErrorShell(bodyText: string): boolean {
  const t = bodyText.toLowerCase();
  return (
    t.includes("application error: a client-side exception") ||
    t.includes("this page couldn’t load") ||
    t.includes("this page couldn't load") ||
    (t.includes("internal server error") && t.includes("digest"))
  );
}
