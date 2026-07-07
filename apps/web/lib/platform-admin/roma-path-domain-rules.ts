import type { RomaTestCatalogDomain } from "./roma-test-catalog.types";

/** Canonical path → product area + catalog domain mapping (single source of truth). */
export type RomaPathDomainRule = {
  id: string;
  match: (path: string) => boolean;
  areaIds: readonly string[];
  catalogDomains: readonly RomaTestCatalogDomain[];
  securitySensitive?: boolean;
};

export const ROMA_PATH_DOMAIN_RULES: readonly RomaPathDomainRule[] = [
  {
    id: "platform-admin",
    match: (p) => /platform-admin|platform\.owner|platform_owner/i.test(p),
    areaIds: ["pa-platform-admin", "pa-roma-qa-center"],
    catalogDomains: ["security", "web", "release"],
    securitySensitive: true,
  },
  {
    id: "worker-reports",
    match: (p) => /api\/v1\/reports|worker.*report|reports\/|field-report|daily-report/i.test(p),
    areaIds: ["pa-worker-reports"],
    catalogDomains: ["backend", "business_flow", "mobile_ios", "mobile_android"],
  },
  {
    id: "manager-review",
    match: (p) => /manager.*review|approve.*report/i.test(p),
    areaIds: ["pa-manager-review"],
    catalogDomains: [],
  },
  {
    id: "ai-copilot",
    match: (p) => /copilot|\/ai\/|vision|openai|llm/i.test(p),
    areaIds: ["pa-ai-copilot"],
    catalogDomains: ["ai", "backend", "security"],
  },
  {
    id: "authentication",
    match: (p) => /middleware|auth|login|session|supabase\/auth/i.test(p),
    areaIds: ["pa-authentication"],
    catalogDomains: ["security", "backend", "web", "release"],
    securitySensitive: true,
  },
  {
    id: "tenant-isolation",
    match: (p) => /rls|tenant\.isol|platform_owner_grants|break_glass|migration/i.test(p),
    areaIds: ["pa-tenant-isolation", "pa-platform-admin"],
    catalogDomains: ["database", "security"],
    securitySensitive: true,
  },
  {
    id: "storage-upload",
    match: (p) => /upload|storage|bucket/i.test(p),
    areaIds: ["pa-documents", "pa-worker-reports"],
    catalogDomains: ["backend", "business_flow"],
  },
  {
    id: "projects",
    match: (p) => /project/i.test(p),
    areaIds: ["pa-projects"],
    catalogDomains: [],
  },
  {
    id: "documents",
    match: (p) => /document/i.test(p),
    areaIds: ["pa-documents"],
    catalogDomains: [],
  },
  {
    id: "costs-budgets",
    match: (p) => /cost|budget/i.test(p),
    areaIds: ["pa-costs-budgets"],
    catalogDomains: [],
  },
  {
    id: "release-pipeline",
    match: (p) => /wrangler|deploy|cloudflare|\.github\/workflows/i.test(p),
    areaIds: ["pa-release-pipeline"],
    catalogDomains: ["release"],
  },
  {
    id: "ios-mobile",
    match: (p) => /^ios\//i.test(p) || /ios\/Shared/i.test(p),
    areaIds: ["pa-worker-reports", "pa-manager-review"],
    catalogDomains: ["mobile_ios"],
  },
  {
    id: "android-mobile",
    match: (p) => /^android\//i.test(p),
    areaIds: ["pa-worker-reports", "pa-manager-review"],
    catalogDomains: ["mobile_android"],
  },
  {
    id: "public-website",
    match: (p) => /\(public\)|public-site|marketing/i.test(p),
    areaIds: ["pa-public-website"],
    catalogDomains: [],
  },
  {
    id: "web-dashboard",
    match: (p) => /\(dashboard\)|dashboard\//i.test(p),
    areaIds: ["pa-web-dashboard"],
    catalogDomains: [],
  },
] as const;

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function matchPathToAreaIds(path: string): readonly string[] {
  const areaIds: string[] = [];
  for (const rule of ROMA_PATH_DOMAIN_RULES) {
    if (rule.match(path)) areaIds.push(...rule.areaIds);
  }
  return uniqueStrings(areaIds);
}

export function matchPathToCatalogDomains(path: string): readonly RomaTestCatalogDomain[] {
  const domains: RomaTestCatalogDomain[] = [];
  for (const rule of ROMA_PATH_DOMAIN_RULES) {
    if (rule.match(path)) domains.push(...rule.catalogDomains);
  }
  return uniqueStrings(domains) as RomaTestCatalogDomain[];
}

export function matchPathsToAreaIds(paths: readonly string[]): string[] {
  const areaIds: string[] = [];
  for (const path of paths) {
    areaIds.push(...matchPathToAreaIds(path));
  }
  return uniqueStrings(areaIds);
}

export function matchPathsToCatalogDomains(paths: readonly string[]): RomaTestCatalogDomain[] {
  const domains: RomaTestCatalogDomain[] = [];
  for (const path of paths) {
    domains.push(...matchPathToCatalogDomains(path));
  }
  return uniqueStrings(domains) as RomaTestCatalogDomain[];
}

/** True when any changed path matches a security-sensitive ROMA rule. */
export function isSecuritySensitivePath(path: string): boolean {
  return ROMA_PATH_DOMAIN_RULES.some((rule) => rule.securitySensitive && rule.match(path));
}

export function isSecuritySensitiveChange(paths: readonly string[]): boolean {
  const joined = paths.join(" ");
  if (/platform-admin|platform_owner|tenant\.isol|rls|rbac|middleware|auth|security/i.test(joined)) {
    return true;
  }
  return paths.some(isSecuritySensitivePath);
}
