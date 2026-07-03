import { PLATFORM_ADMIN_BASE_PATH, PLATFORM_ADMIN_PREFERRED_HOST } from "./constants";

export type ReadonlyStatusLevel = "ready" | "partial" | "blocked" | "not_started";

export type ReadonlyStatusCard = {
  title: string;
  level: ReadonlyStatusLevel;
  summary: string;
  bullets: string[];
};

export type EvidenceReportRef = {
  label: string;
  path: string;
  note: string;
};

/** Static read-only snapshot for platform testing center (no runtime CI/filesystem reads). */
export const PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT = {
  pageMode: "read_only" as const,
  testExecutionEnabled: false,
  hostDeployStatus: "partial" as const,
  preferredHost: PLATFORM_ADMIN_PREFERRED_HOST,
  routePath: `${PLATFORM_ADMIN_BASE_PATH}/testing`,
  updatedAt: "2026-07-03",
  overallTesting: {
    title: "Overall Testing Status",
    level: "partial" as ReadonlyStatusLevel,
    summary: "Platform admin boundary is validated; ROMA runtime and UI test execution are not enabled.",
    bullets: [
      "P0 lockdown and Phase 1 platform admin migration accepted on security/platform-admin-separation.",
      "No-tail audit complete — safe to show read-only testing center.",
      "Test execution from this UI is disabled by design (Phase 1 read-only).",
    ],
  },
  platformAdminSecurity: {
    title: "Platform Admin Security Status",
    level: "ready" as ReadonlyStatusLevel,
    summary: "Tenant /admin is isolated from platform-admin; platform owner grant required.",
    bullets: [
      "Middleware + layout guard: gateOwnerRequest and assertPlatformOwnerPageAccess.",
      "Canonical APIs: /api/v1/platform/*; deprecated owner and tenant-admin billing/leads aliases.",
      "P0: tenant admins cannot POST global flags, trigger cross-tenant cron, or reach platform billing/leads.",
    ],
  },
  romaFramework: {
    title: "ROMA Framework Status",
    level: "partial" as ReadonlyStatusLevel,
    summary: "ROMA OS governance Stages 0–2C complete on feature/roma-qa-framework; runtime adapters not started.",
    bullets: [
      "Stages 0–2C: architecture, intelligence, OS kernel — exit verdict YES (docs on feature/roma-qa-framework).",
      "Stage 2D+ (machine schemas, QA app adapters, execution): NOT STARTED.",
      "ROMA cannot mutate production from this page; recommendation-only intelligence per ADR-0007.",
    ],
  },
  releaseReadiness: {
    title: "Release Readiness",
    level: "partial" as ReadonlyStatusLevel,
    summary: "Platform admin cabinet ready on route fallback; dedicated admin host and ROMA execution pending.",
    bullets: [
      `Preferred host ${PLATFORM_ADMIN_PREFERRED_HOST} — DNS/Worker routing not deployed (PARTIAL).`,
      "Safe fallback: /[locale]/platform-admin on primary domain.",
      "ROMA read-only page is the current testing surface; execution design is next phase.",
    ],
  },
  evidenceReports: [
    {
      label: "P0 lockdown",
      path: "docs/audits/PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md",
      note: "Platform-wide actions removed from tenant /admin APIs and UI.",
    },
    {
      label: "Phase 1 migration",
      path: "docs/audits/PLATFORM_ADMIN_PHASE1_MIGRATION_REPORT.md",
      note: "Platform-admin route group and /api/v1/platform/* canonical namespace.",
    },
    {
      label: "Phase 1 post-audit",
      path: "docs/audits/PLATFORM_ADMIN_PHASE1_POST_AUDIT.md",
      note: "12/12 checks pass; no P0 regression.",
    },
    {
      label: "No-tail readiness",
      path: "docs/audits/PLATFORM_ADMIN_NO_TAIL_AUDIT.md",
      note: "READY_FOR_ROMA_READONLY_PAGE = YES.",
    },
    {
      label: "ROMA merge tracker",
      path: "docs/roma/ROMA_MERGE_TRACKER.md",
      note: "Stage 2C DONE; Stages 2D–8 NOT STARTED on feature/roma-qa-framework.",
    },
    {
      label: "ROMA Stage 2C review",
      path: "docs/roma/ROMA_STAGE2C_REVIEW.md",
      note: "OS kernel & constitution gate passed.",
    },
  ] satisfies EvidenceReportRef[],
  knownBlockers: [
    "admin.aistroyka.ai host routing not deployed — platform admin uses /[locale]/platform-admin fallback.",
    "ROMA test execution UI and /api/v1/platform/testing/* run endpoints not implemented.",
    "Uncommitted QA scaffold (docs/qa/, scripts/qa/) must not be mixed into platform-admin security commits.",
    "Dead legacy Admin*Client files under tenant /admin paths — hygiene only, not a security blocker.",
  ],
  nextSafeAction:
    "Design ROMA execution phase: /api/v1/platform/testing/reports (read) then gated run endpoints with platform-owner write role — only after read-only page is merged and validated on staging.",
} as const;

export function levelBadgeVariant(
  level: ReadonlyStatusLevel
): "success" | "warning" | "danger" | "neutral" {
  switch (level) {
    case "ready":
      return "success";
    case "partial":
      return "warning";
    case "blocked":
      return "danger";
    case "not_started":
      return "neutral";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}
