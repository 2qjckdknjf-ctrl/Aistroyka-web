import { getHealthResponse } from "@/lib/controllers/health";
import { getPublicConfig, getBuildStamp, hasSupabaseEnv } from "@/lib/config";
import { validateReleaseEnv } from "@/lib/config/release-env";
import { getSystemHealth, type ServiceStatus } from "@/lib/system/health.service";
import { getBillingAdapterDiagnostics } from "@/lib/platform/billing-readiness/billing-adapter-registry";
import { getAdminClient } from "@/lib/supabase/admin";
import { PLATFORM_ADMIN_PREFERRED_HOST } from "./constants";
import type {
  BlockerSeverity,
  LatestChanges,
  QualityBlocker,
  QualityComponentCard,
  QualityStatus,
  ReadinessCategory,
  ReadinessLevel,
  RomaMaturityItem,
  RomaQualityDashboard,
  KnownReportRef,
} from "./roma-quality-dashboard.types";

const UPLOAD_BUCKET = "media";

function mapServiceStatus(status: ServiceStatus): QualityStatus {
  switch (status) {
    case "ok":
      return "healthy";
    case "degraded":
      return "degraded";
    case "error":
      return "unavailable";
    case "unavailable":
      return "not_configured";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusLabel(status: QualityStatus): string {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "unavailable":
      return "Unavailable";
    case "unknown":
      return "Unknown";
    case "not_configured":
      return "Not Configured";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function readinessFromPercent(percent: number | null): ReadinessLevel {
  if (percent === null) return "unknown";
  if (percent >= 85) return "ready";
  if (percent >= 40) return "partial";
  return "blocked";
}

function readinessPercent(level: ReadinessLevel): number | null {
  switch (level) {
    case "ready":
      return 100;
    case "partial":
      return 50;
    case "blocked":
      return 0;
    case "unknown":
      return null;
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

function averagePercent(categories: ReadinessCategory[]): number | null {
  const scored = categories.map((c) => c.percent).filter((p): p is number => p !== null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
}

function resolveEnvironmentLabel(): string {
  const appEnv = getPublicConfig().NEXT_PUBLIC_APP_ENV;
  if (appEnv === "production" || appEnv === "staging") {
    return appEnv.charAt(0).toUpperCase() + appEnv.slice(1);
  }
  const nodeEnv = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  if (nodeEnv === "production") return "Production";
  if (nodeEnv === "development") return "Development";
  return appEnv || "Unknown";
}

function resolveDeployBranch(): string | null {
  const ref =
    (process.env.VERCEL_GIT_COMMIT_REF ?? "").trim() ||
    (process.env.GITHUB_REF_NAME ?? "").trim() ||
    (process.env.GITHUB_HEAD_REF ?? "").trim();
  return ref || null;
}

async function checkStorage(): Promise<{ status: QualityStatus; details: string }> {
  const admin = getAdminClient();
  if (!admin) {
    return { status: "not_configured", details: "Service role not configured — storage probe skipped." };
  }
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      return { status: "unavailable", details: `Storage API error: ${error.message}` };
    }
    const buckets = data ?? [];
    const hasMedia = buckets.some((b) => b.name === UPLOAD_BUCKET);
    if (!hasMedia) {
      return {
        status: "degraded",
        details: `Buckets reachable (${buckets.length}) but "${UPLOAD_BUCKET}" bucket not found.`,
      };
    }
    return {
      status: "healthy",
      details: `Supabase storage reachable; "${UPLOAD_BUCKET}" bucket present.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "storage_probe_failed";
    return { status: "unavailable", details: message };
  }
}

function buildKnownReports(): KnownReportRef[] {
  return [
    {
      label: "P0 lockdown",
      path: "docs/audits/PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md",
      note: "Platform-wide actions removed from tenant /admin.",
      href: null,
    },
    {
      label: "Phase 1 migration",
      path: "docs/audits/PLATFORM_ADMIN_PHASE1_MIGRATION_REPORT.md",
      note: "Platform-admin route group and /api/v1/platform/* namespace.",
      href: null,
    },
    {
      label: "Phase 1 post-audit",
      path: "docs/audits/PLATFORM_ADMIN_PHASE1_POST_AUDIT.md",
      note: "Migration validation — no P0 regression.",
      href: null,
    },
    {
      label: "No-tail readiness",
      path: "docs/audits/PLATFORM_ADMIN_NO_TAIL_AUDIT.md",
      note: "Pre-ROMA gate — read-only page cleared.",
      href: null,
    },
    {
      label: "ROMA merge tracker",
      path: "docs/roma/ROMA_MERGE_TRACKER.md",
      note: "ROMA stage progression on feature/roma-qa-framework.",
      href: null,
    },
    {
      label: "ROMA Stage 2C review",
      path: "docs/roma/ROMA_STAGE2C_REVIEW.md",
      note: "OS kernel & constitution gate.",
      href: null,
    },
  ];
}

function deriveBlockers(input: {
  healthOk: boolean;
  dbOk: boolean;
  releaseReport: ReturnType<typeof validateReleaseEnv>;
  adminHostDeployed: boolean | null;
  components: QualityComponentCard[];
}): QualityBlocker[] {
  const blockers: QualityBlocker[] = [];

  if (!input.healthOk) {
    blockers.push({
      title: "Core health check failing",
      component: "Backend API",
      severity: "critical",
      recommendation: "Inspect /api/v1/health and Supabase connectivity before pilot operations.",
    });
  }
  if (!input.dbOk) {
    blockers.push({
      title: "Database unreachable or misconfigured",
      component: "Database",
      severity: "critical",
      recommendation: "Verify NEXT_PUBLIC_SUPABASE_URL and anon key; confirm tenants table probe.",
    });
  }
  for (const name of input.releaseReport.criticalMissing) {
    blockers.push({
      title: `Missing required env: ${name}`,
      component: "Platform",
      severity: "critical",
      recommendation: "Set required environment variable per docs/ENVIRONMENT-VARIABLES.md.",
    });
  }
  for (const name of input.releaseReport.forbiddenInProdSet) {
    blockers.push({
      title: `Debug flag enabled in production: ${name}`,
      component: "Security",
      severity: "critical",
      recommendation: "Unset or set to false before production operations.",
    });
  }
  if (input.adminHostDeployed === false) {
    blockers.push({
      title: "Dedicated platform admin host not deployed",
      component: "Platform Admin",
      severity: "warning",
      recommendation: `Route fallback /platform-admin is active; deploy ${PLATFORM_ADMIN_PREFERRED_HOST} when DNS/Worker routing is ready.`,
    });
  }
  if (!input.releaseReport.aiConfigured) {
    blockers.push({
      title: "No AI provider API key configured",
      component: "AI",
      severity: "warning",
      recommendation: "Set OPENAI_API_KEY or alternate vision provider keys for AI features.",
    });
  }
  if (!input.releaseReport.billingConfigured) {
    blockers.push({
      title: "Stripe billing not fully configured",
      component: "Billing",
      severity: "information",
      recommendation: "Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET when live billing is required.",
    });
  }
  if (!input.releaseReport.pushConfigured) {
    blockers.push({
      title: "Push notifications not configured",
      component: "Notifications",
      severity: "information",
      recommendation: "Configure FCM or APNS credentials for mobile push delivery.",
    });
  }

  const degraded = input.components.filter((c) => c.status === "degraded" || c.status === "unavailable");
  for (const card of degraded) {
    if (blockers.some((b) => b.component === card.name)) continue;
    const severity: BlockerSeverity =
      card.status === "unavailable" ? "warning" : "information";
    blockers.push({
      title: `${card.name} reported ${card.statusLabel}`,
      component: card.name,
      severity,
      recommendation: card.details,
    });
  }

  if (blockers.length === 0) {
    blockers.push({
      title: "No critical blockers detected from live probes",
      component: "Platform",
      severity: "information",
      recommendation: "Continue monitoring via this dashboard; test execution remains disabled.",
    });
  }

  return blockers;
}

export async function buildRomaQualityDashboard(): Promise<RomaQualityDashboard> {
  const generatedAt = new Date().toISOString();
  const publicConfig = getPublicConfig();
  const releaseReport = validateReleaseEnv();
  const billingDiag = getBillingAdapterDiagnostics();

  const [healthResult, systemHealth, storageProbe] = await Promise.all([
    getHealthResponse(),
    getSystemHealth().catch(() => null),
    checkStorage(),
  ]);

  const healthBody = healthResult.body as {
    ok?: boolean;
    db?: string;
    aiConfigured?: boolean;
    openaiConfigured?: boolean;
    supabaseReachable?: boolean;
    serviceRoleConfigured?: boolean;
    env?: string;
    buildStamp?: { sha7?: string; buildTime?: string };
    reason?: string;
  };

  const { sha, buildTime } = getBuildStamp();
  const buildSha7 = healthBody.buildStamp?.sha7 ?? (sha ? sha.slice(0, 7) : null);
  const deployTime = healthBody.buildStamp?.buildTime || buildTime || null;

  const healthOk = healthBody.ok === true;
  const dbOk = healthBody.db === "ok";
  const aiConfigured = Boolean(healthBody.aiConfigured || healthBody.openaiConfigured || releaseReport.aiConfigured);
  const serviceRoleConfigured = Boolean(healthBody.serviceRoleConfigured);

  const adminHostConfigured =
    typeof process.env.OWNER_ALLOWED_HOSTS === "string" && process.env.OWNER_ALLOWED_HOSTS.trim() !== "";
  const adminHostDeployed: boolean | null = adminHostConfigured ? null : false;

  const mobileLinks = {
    iosWorker: process.env.APP_STORE_WORKER_URL?.trim() || null,
    iosManager: process.env.APP_STORE_MANAGER_URL?.trim() || null,
    androidWorker: process.env.GOOGLE_PLAY_WORKER_URL?.trim() || null,
    androidManager: process.env.GOOGLE_PLAY_MANAGER_URL?.trim() || null,
  };
  const mobileConfigured = Object.values(mobileLinks).some(Boolean);

  const telegramConfigured =
    Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) &&
    Boolean(
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || process.env.TELEGRAM_BOT_USERNAME?.trim()
    );
  const pushConfigured = releaseReport.pushConfigured;

  const overallHealth: QualityStatus = healthOk
    ? systemHealth?.status === "degraded"
      ? "degraded"
      : "healthy"
    : healthBody.db === "error"
      ? "unavailable"
      : "degraded";

  const systemComponents: QualityComponentCard[] = [
    {
      id: "website",
      name: "Website",
      status: healthOk ? "healthy" : "unavailable",
      statusLabel: statusLabel(healthOk ? "healthy" : "unavailable"),
      lastCheck: generatedAt,
      details: healthOk
        ? `Public app responding; env=${resolveEnvironmentLabel()}.`
        : `Health probe failed${healthBody.reason ? `: ${healthBody.reason}` : "."}`,
    },
    {
      id: "web_dashboard",
      name: "Web Dashboard",
      status: dbOk && hasSupabaseEnv() ? "healthy" : dbOk ? "degraded" : "unavailable",
      statusLabel: statusLabel(dbOk && hasSupabaseEnv() ? "healthy" : dbOk ? "degraded" : "unavailable"),
      lastCheck: generatedAt,
      details: hasSupabaseEnv()
        ? dbOk
          ? "Dashboard auth/data prerequisites reachable."
          : "Supabase env present but DB probe failed."
        : "Supabase public env not configured.",
    },
    {
      id: "backend_api",
      name: "Backend API",
      status: healthOk ? "healthy" : "unavailable",
      statusLabel: statusLabel(healthOk ? "healthy" : "unavailable"),
      lastCheck: generatedAt,
      details: `/api/v1/health → HTTP ${healthResult.status}; ok=${String(healthBody.ok)}.`,
    },
    {
      id: "database",
      name: "Database",
      status: dbOk ? "healthy" : hasSupabaseEnv() ? "unavailable" : "not_configured",
      statusLabel: statusLabel(dbOk ? "healthy" : hasSupabaseEnv() ? "unavailable" : "not_configured"),
      lastCheck: generatedAt,
      details: dbOk
        ? "Supabase tenants probe succeeded."
        : hasSupabaseEnv()
          ? `DB status: ${healthBody.db ?? "unknown"}${healthBody.reason ? ` (${healthBody.reason})` : ""}.`
          : "NEXT_PUBLIC_SUPABASE_* not set.",
    },
    {
      id: "storage",
      name: "Storage",
      status: storageProbe.status,
      statusLabel: statusLabel(storageProbe.status),
      lastCheck: generatedAt,
      details: storageProbe.details,
    },
    {
      id: "authentication",
      name: "Authentication",
      status: hasSupabaseEnv() ? (dbOk ? "healthy" : "degraded") : "not_configured",
      statusLabel: statusLabel(hasSupabaseEnv() ? (dbOk ? "healthy" : "degraded") : "not_configured"),
      lastCheck: generatedAt,
      details: hasSupabaseEnv()
        ? `Supabase auth stack configured; service role ${serviceRoleConfigured ? "present" : "missing"}.`
        : "Supabase env missing — auth unavailable.",
    },
    {
      id: "notifications",
      name: "Notifications",
      status: pushConfigured ? "healthy" : telegramConfigured ? "degraded" : "not_configured",
      statusLabel: statusLabel(pushConfigured ? "healthy" : telegramConfigured ? "degraded" : "not_configured"),
      lastCheck: generatedAt,
      details: pushConfigured
        ? "FCM or APNS credentials configured."
        : telegramConfigured
          ? "Telegram login configured; mobile push not fully configured."
          : "Push and Telegram notification credentials not configured.",
    },
    {
      id: "ai",
      name: "AI",
      status: aiConfigured
        ? systemHealth
          ? mapServiceStatus(systemHealth.services.ai_brain)
          : "healthy"
        : "not_configured",
      statusLabel: statusLabel(
        aiConfigured
          ? systemHealth
            ? mapServiceStatus(systemHealth.services.ai_brain)
            : "healthy"
          : "not_configured"
      ),
      lastCheck: generatedAt,
      details: aiConfigured
        ? `AI configured (openai=${String(healthBody.openaiConfigured)}; analysis=${String(healthBody.aiConfigured)}).`
        : "No AI provider or analysis endpoint configured.",
    },
    {
      id: "cloudflare",
      name: "Cloudflare",
      status: publicConfig.NEXT_PUBLIC_APP_URL.includes("aistroyka.ai") ? "healthy" : "unknown",
      statusLabel: statusLabel(
        publicConfig.NEXT_PUBLIC_APP_URL.includes("aistroyka.ai") ? "healthy" : "unknown"
      ),
      lastCheck: generatedAt,
      details: publicConfig.NEXT_PUBLIC_APP_URL
        ? `App URL: ${publicConfig.NEXT_PUBLIC_APP_URL}. No live Cloudflare Workers API probe — configuration only.`
        : "NEXT_PUBLIC_APP_URL not set.",
    },
    {
      id: "supabase",
      name: "Supabase",
      status: healthBody.supabaseReachable
        ? dbOk
          ? "healthy"
          : "degraded"
        : hasSupabaseEnv()
          ? "unavailable"
          : "not_configured",
      statusLabel: statusLabel(
        healthBody.supabaseReachable
          ? dbOk
            ? "healthy"
            : "degraded"
          : hasSupabaseEnv()
            ? "unavailable"
            : "not_configured"
      ),
      lastCheck: generatedAt,
      details: hasSupabaseEnv()
        ? `Reachable=${String(healthBody.supabaseReachable)}; DB=${healthBody.db ?? "unknown"}.`
        : "Supabase project URL/key not configured.",
    },
    {
      id: "android",
      name: "Android",
      status: mobileLinks.androidWorker || mobileLinks.androidManager ? "degraded" : "unknown",
      statusLabel: statusLabel(
        mobileLinks.androidWorker || mobileLinks.androidManager ? "degraded" : "unknown"
      ),
      lastCheck: generatedAt,
      details: mobileConfigured
        ? `Store links configured (worker=${Boolean(mobileLinks.androidWorker)}; manager=${Boolean(mobileLinks.androidManager)}). No live Play build probe.`
        : "No Google Play URLs in environment — mobile distribution status unknown.",
    },
    {
      id: "ios",
      name: "iOS",
      status: mobileLinks.iosWorker || mobileLinks.iosManager ? "degraded" : "unknown",
      statusLabel: statusLabel(mobileLinks.iosWorker || mobileLinks.iosManager ? "degraded" : "unknown"),
      lastCheck: generatedAt,
      details: mobileConfigured
        ? `Store links configured (worker=${Boolean(mobileLinks.iosWorker)}; manager=${Boolean(mobileLinks.iosManager)}). No live TestFlight probe.`
        : "No App Store URLs in environment — mobile distribution status unknown.",
    },
  ];

  const frontendLevel: ReadinessLevel = healthOk && buildSha7 ? "ready" : healthOk ? "partial" : "blocked";
  const backendLevel: ReadinessLevel = healthOk && serviceRoleConfigured ? "ready" : healthOk ? "partial" : "blocked";
  const databaseLevel: ReadinessLevel = dbOk ? "ready" : hasSupabaseEnv() ? "blocked" : "unknown";
  const mobileLevel: ReadinessLevel = mobileConfigured ? "partial" : "unknown";
  const aiLevel: ReadinessLevel = aiConfigured ? "ready" : "partial";
  const securityLevel: ReadinessLevel =
    releaseReport.verdict === "FAIL"
      ? "blocked"
      : releaseReport.forbiddenInProdSet.length > 0
        ? "blocked"
        : releaseReport.cronConfigured
          ? "ready"
          : "partial";
  const performanceLevel: ReadinessLevel = "unknown";
  const documentationLevel: ReadinessLevel = "partial";

  const releaseReadiness: ReadinessCategory[] = [
    {
      id: "frontend",
      label: "Frontend",
      level: frontendLevel,
      percent: readinessPercent(frontendLevel),
      summary: frontendLevel === "ready" ? "App health OK with build stamp." : "Health or build metadata incomplete.",
    },
    {
      id: "backend",
      label: "Backend",
      level: backendLevel,
      percent: readinessPercent(backendLevel),
      summary: serviceRoleConfigured
        ? "API health and service role configured."
        : "API reachable; service role missing.",
    },
    {
      id: "database",
      label: "Database",
      level: databaseLevel,
      percent: readinessPercent(databaseLevel),
      summary: dbOk ? "Database probe OK." : "Database probe failed or not configured.",
    },
    {
      id: "mobile",
      label: "Mobile",
      level: mobileLevel,
      percent: readinessPercent(mobileLevel),
      summary: mobileConfigured
        ? "Store URLs present; live build status not probed."
        : "Mobile distribution status unknown.",
    },
    {
      id: "ai",
      label: "AI",
      level: aiLevel,
      percent: readinessPercent(aiLevel),
      summary: aiConfigured ? "AI provider configured." : "AI provider not configured.",
    },
    {
      id: "security",
      label: "Security",
      level: securityLevel,
      percent: readinessPercent(securityLevel),
      summary: `Release env verdict: ${releaseReport.verdict}.`,
    },
    {
      id: "performance",
      label: "Performance",
      level: performanceLevel,
      percent: null,
      summary: "No live performance telemetry source wired to this dashboard.",
    },
    {
      id: "documentation",
      label: "Documentation",
      level: documentationLevel,
      percent: readinessPercent(documentationLevel),
      summary: "Audit and ROMA governance reports referenced; no runtime doc index.",
    },
  ];

  const releasePercent = averagePercent(releaseReadiness);
  const releaseLevel = readinessFromPercent(releasePercent);

  const latestChanges: LatestChanges = {
    lastDeploy: deployTime,
    lastCommit: buildSha7,
    branch: resolveDeployBranch(),
    build: buildSha7,
    timestamp: deployTime ?? generatedAt,
  };

  const romaStatus: RomaMaturityItem[] = [
    {
      id: "architecture",
      label: "Architecture",
      level: systemHealth ? (systemHealth.status === "ok" ? "ready" : "partial") : "unknown",
      summary: systemHealth
        ? `Live system health: ${systemHealth.status}.`
        : "System health service unavailable for probe.",
      source: systemHealth ? "live" : "unavailable",
    },
    {
      id: "governance",
      label: "Governance",
      level: releaseReport.verdict === "FAIL" ? "blocked" : "ready",
      summary: `Release env validation: ${releaseReport.verdict}. Platform owner guard active.`,
      source: "live",
    },
    {
      id: "platform",
      label: "Platform",
      level: healthOk && dbOk ? "ready" : "partial",
      summary: adminHostDeployed === false
        ? `Platform admin on route fallback; ${PLATFORM_ADMIN_PREFERRED_HOST} pending.`
        : "Platform admin cabinet and health probes operational.",
      source: "live",
    },
    {
      id: "execution",
      label: "Execution",
      level: "blocked",
      summary: "ROMA test execution from UI is not enabled.",
      source: "configuration",
    },
    {
      id: "learning",
      label: "Learning",
      level: "unknown",
      summary: "No live ROMA learning loop telemetry source.",
      source: "unavailable",
    },
    {
      id: "adapter_readiness",
      label: "Adapter readiness",
      level: billingDiag.configValid && aiConfigured ? "partial" : "blocked",
      summary: `Billing adapter=${billingDiag.activeAdapterKind}; AI=${aiConfigured ? "configured" : "not configured"}.`,
      source: "live",
    },
  ];

  const dataSourcesAvailable = [
    "GET /api/v1/health (in-process)",
    "lib/system/health.service",
    "lib/config/release-env",
    "lib/platform/billing-readiness (adapter diagnostics)",
    "Supabase storage listBuckets (when service role present)",
    "Build stamp env (NEXT_PUBLIC_BUILD_SHA / VERCEL_GIT_COMMIT_SHA)",
  ];
  const dataSourcesUnavailable = [
    "Cloudflare Workers live API status",
    "CI pipeline / test run history",
    "Mobile store build/TestFlight live probes",
    "Performance telemetry (Lighthouse / RUM)",
    "Database migration version probe",
    "ROMA learning loop telemetry",
    "Filesystem doc index at runtime",
  ];

  return {
    pageMode: "read_only",
    testExecutionEnabled: false,
    generatedAt,
    environment: {
      label: resolveEnvironmentLabel(),
      appUrl: publicConfig.NEXT_PUBLIC_APP_URL || null,
      nodeEnv: process.env.NODE_ENV ?? null,
      preferredAdminHost: PLATFORM_ADMIN_PREFERRED_HOST,
      adminHostDeployed,
    },
    platformStatus: {
      overallHealth,
      overallHealthLabel: statusLabel(overallHealth),
      releaseReadiness: releaseLevel,
      releaseReadinessPercent: releasePercent,
      lastUpdated: generatedAt,
    },
    systemComponents,
    releaseReadiness,
    blockers: deriveBlockers({
      healthOk,
      dbOk,
      releaseReport,
      adminHostDeployed,
      components: systemComponents,
    }),
    latestChanges,
    romaStatus,
    knownReports: buildKnownReports(),
    dataSources: {
      available: dataSourcesAvailable,
      unavailable: dataSourcesUnavailable,
    },
  };
}
