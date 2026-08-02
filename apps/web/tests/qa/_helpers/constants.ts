/** Supported locales per `i18n/routing`. */
export const LOCALES = ["ru", "en", "es", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = (process.env.QA_LOCALE || process.env.E2E_LOCALE || "en") as Locale;

export function qaBaseURL(): string {
  return (process.env.PLAYWRIGHT_BASE_URL ?? process.env.QA_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function localePath(locale: string, suffix: string): string {
  const clean = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `/${locale}${clean}`;
}

/** Public marketing routes discovered under `(public)/`. */
export const PUBLIC_ROUTES = [
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

/** Dashboard sections for navigation smoke. */
export const DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/projects",
  "/dashboard/tasks",
  "/dashboard/daily-reports",
  "/dashboard/devices",
  "/dashboard/ai",
  "/dashboard/settings",
] as const;

/** Internal cost field names that must never appear on stakeholder/portal surfaces. */
export const FINANCE_DENYLIST = [
  "internal_margin",
  "planned_cost",
  "actual_cost",
  "subcontractor_cost",
  "budget_pressure",
  "cost_overrun",
  "profitability",
] as const;
