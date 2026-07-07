import type { RomaEngineeringIntelligence } from "./roma-engineering-intelligence.types";
import type { RomaQualityDashboard } from "./roma-quality-dashboard.types";
import type {
  RomaQaCenterModel,
  RomaQaCenterSection,
  RomaQaCenterSectionId,
} from "./roma-qa-center.types";

export const ROMA_QA_CENTER_SECTION_IDS = [
  "dashboard",
  "audits",
  "web",
  "mobile",
  "backend",
  "ai",
  "security",
  "performance",
  "regression",
  "coverage",
  "history",
  "reports",
] as const satisfies readonly RomaQaCenterSectionId[];

export type RomaQaCenterRouteSectionId = Exclude<RomaQaCenterSectionId, "dashboard">;

export const ROMA_QA_CENTER_ROUTE_SECTION_IDS = ROMA_QA_CENTER_SECTION_IDS.filter(
  (id): id is RomaQaCenterRouteSectionId => id !== "dashboard"
);

export function isRomaQaCenterRouteSectionId(value: string): value is RomaQaCenterRouteSectionId {
  return (ROMA_QA_CENTER_ROUTE_SECTION_IDS as readonly string[]).includes(value);
}

const BASE_REPORTS: RomaQaCenterSection["relatedReports"] = [
  { label: "Platform admin owner-only access", path: "docs/security/PLATFORM_ADMIN_OWNER_ONLY_ACCESS_REPORT.md" },
  { label: "ROMA live data integration", path: "docs/audits/ROMA_LIVE_DATA_INTEGRATION_REPORT.md" },
];

function section(
  partial: Omit<RomaQaCenterSection, "relatedReports"> & { relatedReports?: RomaQaCenterSection["relatedReports"] }
): RomaQaCenterSection {
  return {
    relatedReports: partial.relatedReports ?? BASE_REPORTS,
    ...partial,
  };
}

function buildStaticSections(): RomaQaCenterSection[] {
  return [
    section({
      id: "audits",
      title: "Audits",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Safe readonly audit + manual refresh on platform-admin",
      description: "Owner-gated safe audit runs across product surfaces. Explicit refresh and Save Snapshot only.",
      currentCapability:
        "Safe Readonly Audit at /testing/safe-audit with refresh API and redacted snapshot save. No automated execution.",
      futureCapability:
        "Additional scoped audit types (web smoke, API contract, RBAC matrix) with immutable reports.",
      blockers: ["No scheduled audit jobs", "No CI coupling", "Physical device smoke not in center"],
      subAreas: [
        { id: "safe-audit", label: "Safe readonly audit", status: "partial", note: "Refresh + Save Snapshot" },
        { id: "rbac", label: "RBAC boundary", status: "coming_soon", note: "Platform vs tenant isolation matrix" },
        { id: "ai-live", label: "AI live provider", status: "coming_soon", note: "scripts/smoke/ai_live_provider.sh gate" },
        { id: "mobile-smoke", label: "Mobile device smoke", status: "coming_soon", note: "Physical device matrix — not enabled" },
      ],
    }),
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
    section({
      id: "performance",
      title: "Performance",
      status: "coming_soon",
      maturity: "planned",
      sourceAvailability: "Not available",
      description: "Core Web Vitals, API latency, dashboard and mobile performance.",
      currentCapability: "No performance time-series in V1 center.",
      futureCapability: "CWV probes, API p95 dashboards, mobile startup metrics.",
      blockers: ["No performance telemetry ingestion for ROMA center"],
      subAreas: [
        { id: "cwv", label: "Core Web Vitals", status: "unknown", note: "Not available" },
        { id: "api-latency", label: "API latency", status: "unknown", note: "Not available" },
        { id: "dashboard-perf", label: "Dashboard performance", status: "unknown", note: "Not available" },
        { id: "mobile-perf", label: "Mobile performance", status: "unknown", note: "Not available" },
      ],
    }),
    section({
      id: "regression",
      title: "Regression",
      status: "coming_soon",
      maturity: "planned",
      sourceAvailability: "Not available",
      description: "Changed files, affected modules, required checks, risk prediction.",
      currentCapability: "Placeholder only — no git diff integration.",
      futureCapability: "PR-scoped risk hints, required check mapping, module blast-radius.",
      blockers: ["No change-detection pipeline", "No CI integration in center"],
    }),
    section({
      id: "coverage",
      title: "Coverage",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Dashboard data coverage percent (live probes only)",
      description: "Routes, roles, APIs, devices, business flows, AI scenarios.",
      currentCapability: "Evidence coverage % on Dashboard from connected probes — not test coverage metrics.",
      futureCapability: "Route/role/API matrices, device coverage, business-flow catalog.",
      blockers: ["No route matrix automation", "No fabricated coverage percentages"],
    }),
    section({
      id: "history",
      title: "History",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Saved audit snapshots via service-role store (owner only)",
      description: "Previous safe audit runs, release posture snapshots, and trend context.",
      currentCapability:
        "Audit History at /testing/audit-runs lists latest saved snapshots (summary columns, no raw payload in list API).",
      futureCapability: "Compare runs, trend charts, recurring issue fingerprints, retention purge job.",
      blockers: ["No compare/export UI", "No retention purge job", "Execution disabled"],
    }),
    section({
      id: "reports",
      title: "Reports",
      status: "partial",
      maturity: "partial",
      sourceAvailability: "Static repo docs referenced below",
      description: "Downloadable or linked reports and audit artifacts.",
      currentCapability: "Links to existing docs/audits and docs/security reports (reference paths). No artifact upload.",
      futureCapability: "Ingest CI artifacts, store signed reports, export PDF/JSON from runs.",
      blockers: ["No artifact ingestion pipeline"],
      relatedReports: [
        ...BASE_REPORTS,
        { label: "ROMA QA Center V1 architecture", path: "docs/audits/ROMA_QA_CENTER_V1_ARCHITECTURE_REPORT.md" },
        { label: "Platform admin forbidden RCA", path: "docs/security/PLATFORM_ADMIN_FORBIDDEN_ROOT_CAUSE_REPORT.md" },
      ],
    }),
  ];
}

function buildDashboardSection(
  dashboard: RomaQualityDashboard,
  intelligence: RomaEngineeringIntelligence
): RomaQaCenterSection {
  const coverage =
    dashboard.dataCoverage.coveragePercent != null
      ? `${dashboard.dataCoverage.coveragePercent}% probe sources connected`
      : "Unknown";

  return section({
    id: "dashboard",
    title: "Dashboard",
    status: "available",
    maturity: "live",
    sourceAvailability: coverage,
    description: "Live quality dashboard, engineering intelligence, release recommendation, source coverage.",
    currentCapability:
      "Read-only live probes, release decision, confidence, blockers, product-area impact, data coverage.",
    futureCapability: "Same dashboard feeds future audit sections; optional drill-down per domain.",
    blockers: intelligence.coverageBlindSpots.length > 0 ? intelligence.coverageBlindSpots.slice(0, 5) : [],
    relatedReports: BASE_REPORTS,
  });
}

export function buildRomaQaCenterModel(input?: {
  dashboard?: RomaQualityDashboard;
  intelligence?: RomaEngineeringIntelligence;
}): RomaQaCenterModel {
  const staticSections = buildStaticSections();
  const dashboardSection =
    input?.dashboard && input?.intelligence
      ? buildDashboardSection(input.dashboard, input.intelligence)
      : section({
          id: "dashboard",
          title: "Dashboard",
          status: "unknown",
          maturity: "partial",
          sourceAvailability: "Unknown",
          description: "Live quality dashboard and engineering intelligence.",
          currentCapability: "Read-only when probes load successfully.",
          futureCapability: "Feeds all QA center sections.",
          blockers: ["Dashboard data unavailable in this render context"],
        });

  return {
    version: "v1",
    executionEnabled: false,
    generatedAt: new Date().toISOString(),
    sections: [dashboardSection, ...staticSections],
  };
}

export function getRomaQaCenterSection(
  model: RomaQaCenterModel,
  id: RomaQaCenterSectionId
): RomaQaCenterSection | undefined {
  return model.sections.find((s) => s.id === id);
}
