import type {
  RomaQaCenterModel,
  RomaQaCenterSection,
  RomaQaCenterSectionId,
} from "./roma-qa-center.types";
import { ROMA_QA_CENTER_PLATFORM_SECTION_IDS } from "./roma-qa-center-routes";

export const ROMA_QA_CENTER_SECTION_IDS = [
  "dashboard",
  "web",
  "mobile",
  "backend",
  "ai",
  "security",
] as const satisfies readonly RomaQaCenterSectionId[];

export type RomaQaCenterRouteSectionId = RomaQaCenterPlatformSectionId;
export type RomaQaCenterPlatformSectionId = (typeof ROMA_QA_CENTER_PLATFORM_SECTION_IDS)[number];

export { ROMA_QA_CENTER_PLATFORM_SECTION_IDS as ROMA_QA_CENTER_ROUTE_SECTION_IDS };

export function isRomaQaCenterRouteSectionId(value: string): value is RomaQaCenterRouteSectionId {
  return (ROMA_QA_CENTER_PLATFORM_SECTION_IDS as readonly string[]).includes(value);
}

const BASE_REPORTS: RomaQaCenterSection["relatedReports"] = [
  { label: "Platform admin owner-only access", path: "docs/security/PLATFORM_ADMIN_OWNER_ONLY_ACCESS_REPORT.md" },
  { label: "ROMA live data integration", path: "docs/audits/ROMA_LIVE_DATA_INTEGRATION_REPORT.md" },
  { label: "ROMA documentation index", path: "docs/audits/ROMA_DOCUMENTATION_INDEX.md" },
];

function section(
  partial: Omit<RomaQaCenterSection, "relatedReports"> & { relatedReports?: RomaQaCenterSection["relatedReports"] }
): RomaQaCenterSection {
  return {
    relatedReports: partial.relatedReports ?? BASE_REPORTS,
    ...partial,
  };
}

function buildPlatformSections(): RomaQaCenterSection[] {
  return [
    section({
      id: "web",
      title: "Web",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Live probes for public health and deploy stamp",
      description: "Public website and web dashboard quality posture.",
      currentCapability: "Read-only health/deploy probes surfaced on Dashboard. No browser matrix execution.",
      futureCapability: "Playwright suites, locale matrix, dashboard role flows, Core Web Vitals collection.",
      blockers: ["QA execution not enabled", "No browser farm integration"],
      subAreas: [
        { id: "public-site", label: "Public website", status: "partial", note: "Health + buildStamp probes" },
        { id: "dashboard", label: "Web dashboard", status: "unknown", note: "No automated E2E in center yet" },
        { id: "browser-matrix", label: "Browser / device matrix", status: "coming_soon", note: "Not configured" },
      ],
    }),
    section({
      id: "mobile",
      title: "Mobile",
      status: "coming_soon",
      maturity: "planned",
      sourceAvailability: "Not available — no device coverage probes in center",
      description: "Android and iOS Manager/Worker surfaces. Pilot distribution is tracked elsewhere.",
      currentCapability: "Architecture placeholders only. No TestFlight/Play execution from this center.",
      futureCapability: "Per-app readiness, UITest smoke status, device smoke matrix, store gate evidence.",
      blockers: ["Mobile test execution explicitly out of scope for V1", "No mobile run history"],
      subAreas: [
        { id: "android-manager", label: "Android Manager", status: "coming_soon", note: "Scaffold on main" },
        { id: "android-worker", label: "Android Worker", status: "coming_soon", note: "Scaffold on main" },
        { id: "ios-manager", label: "iOS Manager", status: "partial", note: "Primary mobile contour; UITest targets exist" },
        { id: "ios-worker", label: "iOS Worker", status: "partial", note: "Primary mobile contour; UITest targets exist" },
        { id: "device-coverage", label: "Device coverage", status: "unknown", note: "Unknown until device smoke runs exist" },
      ],
    }),
    section({
      id: "backend",
      title: "Backend",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Live health, DB reachability, AI configured flags",
      description: "API, database, storage, auth, jobs, and integrations.",
      currentCapability: "Read-only probes via quality dashboard (health, Supabase, AI configured).",
      futureCapability: "API contract tests, migration drift checks, job queue smoke, integration probes.",
      blockers: ["No API latency time-series in center", "Jobs queue not probed in V1"],
      subAreas: [
        { id: "api", label: "API", status: "partial", note: "/api/v1/health live" },
        { id: "database", label: "Database", status: "partial", note: "Supabase reachable probe" },
        { id: "storage", label: "Storage", status: "unknown", note: "Not probed in V1 center" },
        { id: "auth", label: "Auth", status: "unknown", note: "No auth flow automation in center" },
        { id: "jobs", label: "Jobs", status: "unknown", note: "Not probed" },
        { id: "integrations", label: "Integrations", status: "unknown", note: "Stripe/Telegram not in center V1" },
      ],
    }),
    section({
      id: "ai",
      title: "AI Review",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "AI configured + provider health probes (when reachable)",
      description: "Copilot, prompt safety, leakage checks, provider health, confidence scoring.",
      currentCapability: "Engineering intelligence summarizes AI probe evidence on Dashboard. No injection tests.",
      futureCapability: "Prompt injection suite, leakage regression, live provider gate, confidence calibration.",
      blockers: ["No automated prompt-injection runs", "Copilot E2E not in center"],
      subAreas: [
        { id: "copilot", label: "Copilot", status: "coming_soon", note: "No center execution" },
        { id: "prompt-injection", label: "Prompt injection", status: "coming_soon", note: "Planned safe-audit type" },
        { id: "leakage", label: "Customer finance leakage", status: "coming_soon", note: "Mega-roadmap boundary audits" },
        { id: "provider-health", label: "Provider health", status: "partial", note: "Live probe when configured" },
        { id: "confidence", label: "Confidence", status: "partial", note: "ROMA intelligence score on Dashboard" },
      ],
    }),
    section({
      id: "security",
      title: "Security",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Owner-only access reports + platform admin gate (code)",
      description: "RBAC, tenant isolation, platform admin perimeter, secrets, headers, APIs.",
      currentCapability: "Documented owner-only Access + platform_owner_grants. No automated security scan runs.",
      futureCapability: "RBAC matrix audits, header smoke, tenant isolation probes, secrets inventory checks.",
      blockers: ["Security scan execution not enabled"],
      relatedReports: [
        ...BASE_REPORTS,
        { label: "Admin domain target architecture", path: "docs/security/ADMIN_DOMAIN_TARGET_ARCHITECTURE.md" },
        { label: "Platform admin P0 lockdown", path: "docs/audits/PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md" },
      ],
      subAreas: [
        { id: "rbac", label: "RBAC", status: "partial", note: "platform_owner_grants enforced in app" },
        { id: "tenant-isolation", label: "Tenant isolation", status: "coming_soon", note: "Automated audit planned" },
        { id: "platform-admin", label: "Platform admin", status: "partial", note: "Access + grant owner-only" },
        { id: "secrets", label: "Secrets", status: "unknown", note: "No center inventory probe" },
        { id: "headers", label: "Security headers", status: "partial", note: "Middleware tests exist" },
        { id: "apis", label: "Platform APIs", status: "partial", note: "requirePlatformOwnerApi gate" },
      ],
    }),
  ];
}

/** Static platform-domain sections for `[section]` overview pages. */
let cachedRomaQaCenterModel: RomaQaCenterModel | undefined;

export function buildRomaQaCenterModel(): RomaQaCenterModel {
  if (!cachedRomaQaCenterModel) {
    cachedRomaQaCenterModel = {
      version: "v1",
      executionEnabled: false,
      generatedAt: new Date().toISOString(),
      sections: buildPlatformSections(),
    };
  }
  return cachedRomaQaCenterModel;
}

export function getRomaQaCenterSection(
  model: RomaQaCenterModel,
  id: RomaQaCenterSectionId
): RomaQaCenterSection | undefined {
  return model.sections.find((s) => s.id === id);
}
