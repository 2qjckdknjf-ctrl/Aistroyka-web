import { getPublicConfig, hasSupabaseEnv } from "@/lib/config";
import { isStripeBillingProviderFlagEnabled } from "@/lib/platform/billing-readiness/billing-provider-config";
import { PLATFORM_ADMIN_PREFERRED_HOST } from "./constants";
import {
  buildDataCoverage,
  runLiveProbes,
  type LiveProbeBundle,
} from "./roma-live-probes";
import type {
  BlockerSeverity,
  DataCoverage,
  DomainSection,
  KnownReportRef,
  LatestChanges,
  PlatformOverviewMetrics,
  PlatformTimelineEvent,
  QualityBlocker,
  QualityComponentCard,
  QualityRecommendation,
  QualityStatus,
  ReadinessCategory,
  ReadinessLevel,
  RomaMaturityItem,
  RomaQualityDashboard,
} from "./roma-quality-dashboard.types";

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
      label: "Live quality dashboard",
      path: "docs/audits/ROMA_LIVE_QUALITY_DASHBOARD_REPORT.md",
      note: "First live operations dashboard slice.",
      href: null,
    },
    {
      label: "ROMA merge tracker",
      path: "docs/roma/ROMA_MERGE_TRACKER.md",
      note: "ROMA stage progression on feature/roma-qa-framework.",
      href: null,
    },
  ];
}

function deriveRecommendations(probes: LiveProbeBundle): QualityRecommendation[] {
  const recs: QualityRecommendation[] = [];
  const health = probes.health.data;
  const release = probes.releaseEnv.data;
  const storage = probes.storage.data;
  const billing = probes.billing.data;
  const ai = probes.ai.data;
  const git = probes.gitMetadata.data;
  const migrations = probes.migrations.data;

  if (health && !health.openaiConfigured && release && !release.aiConfigured) {
    recs.push({
      id: "openai_missing",
      title: "OpenAI API key not configured",
      component: "AI",
      severity: "warning",
      evidence: "Health and release-env probes report no OPENAI_API_KEY or alternate provider.",
    });
  }
  if (probes.migrations.connected === false && probes.migrations.error === "service_role_missing") {
    recs.push({
      id: "migration_probe_blocked",
      title: "Cannot verify database migration state",
      component: "Database",
      severity: "information",
      evidence: "SUPABASE_SERVICE_ROLE_KEY missing — migration inventory probe skipped.",
    });
  } else if (probes.migrations.connected === false) {
    recs.push({
      id: "migration_probe_failed",
      title: "Database migration probe unavailable",
      component: "Database",
      severity: "warning",
      evidence: probes.migrations.summary,
    });
  } else if (migrations && !migrations.latestVersion) {
    recs.push({
      id: "migration_empty",
      title: "No migrations recorded in schema_migrations",
      component: "Database",
      severity: "information",
      evidence: "supabase_migrations.schema_migrations returned zero rows.",
    });
  }
  if (storage && (storage.status === "unavailable" || storage.status === "not_configured")) {
    recs.push({
      id: "storage_unavailable",
      title: "Storage probe did not succeed",
      component: "Storage",
      severity: storage.status === "unavailable" ? "warning" : "information",
      evidence: storage.details,
    });
  }
  if (billing?.runtime.flagEnabled && !billing.runtime.configValid) {
    recs.push({
      id: "billing_flag_inconsistent",
      title: "Stripe billing flag enabled but configuration invalid",
      component: "Billing",
      severity: "warning",
      evidence: billing.runtime.fallbackReason ?? "ENABLE_STRIPE_BILLING_PROVIDER on with invalid Stripe config.",
    });
  }
  if (git && !git.sha && !git.buildTime) {
    recs.push({
      id: "build_stamp_missing",
      title: "Build stamp metadata missing",
      component: "Deployments",
      severity: "information",
      evidence: "NEXT_PUBLIC_BUILD_SHA / NEXT_PUBLIC_BUILD_TIME not present at runtime.",
    });
  }
  if (
    health?.buildSha7 &&
    probes.cloudflare.data?.externalBuildSha7 &&
    health.buildSha7 !== probes.cloudflare.data.externalBuildSha7
  ) {
    recs.push({
      id: "build_stamp_drift",
      title: "Edge build stamp differs from in-process build stamp",
      component: "Deployments",
      severity: "warning",
      evidence: `In-process=${health.buildSha7}; external=${probes.cloudflare.data.externalBuildSha7}.`,
    });
  }
  if (release) {
    for (const name of release.criticalMissing) {
      recs.push({
        id: `env_missing_${name}`,
        title: `Required environment variable missing: ${name}`,
        component: "Security",
        severity: "critical",
        evidence: `Release env validation verdict=${release.verdict}.`,
      });
    }
    for (const name of release.forbiddenInProdSet) {
      recs.push({
        id: `env_forbidden_${name}`,
        title: `Debug flag must be disabled in production: ${name}`,
        component: "Security",
        severity: "critical",
        evidence: `${name} is set in production runtime.`,
      });
    }
    if (release.isProduction && !release.cronConfigured) {
      recs.push({
        id: "cron_not_configured",
        title: "Production cron secret not configured",
        component: "Security",
        severity: "critical",
        evidence: "REQUIRE_CRON_SECRET=true requires CRON_SECRET.",
      });
    }
  }
  if (billing && billing.priceMappingsConfigured === 0 && isStripeBillingProviderFlagEnabled()) {
    recs.push({
      id: "stripe_prices_missing",
      title: "Stripe price mappings not configured",
      component: "Billing",
      severity: "information",
      evidence: "ENABLE_STRIPE_BILLING_PROVIDER is on but no STRIPE_PRICE_* env mappings found.",
    });
  }

  return recs;
}

function deriveBlockers(probes: LiveProbeBundle, components: QualityComponentCard[]): QualityBlocker[] {
  const blockers: QualityBlocker[] = [];
  const health = probes.health.data;
  const release = probes.releaseEnv.data;

  if (health && !health.ok) {
    blockers.push({
      title: "Core health check failing",
      component: "Backend API",
      severity: "critical",
      recommendation: "Inspect /api/v1/health and Supabase connectivity.",
    });
  }
  if (health && health.db !== "ok") {
    blockers.push({
      title: "Database probe not healthy",
      component: "Database",
      severity: "critical",
      recommendation: health.reason
        ? `DB probe reason: ${health.reason}`
        : "Verify Supabase URL and anon key.",
    });
  }
  if (release) {
    for (const name of release.criticalMissing) {
      blockers.push({
        title: `Missing required env: ${name}`,
        component: "Platform",
        severity: "critical",
        recommendation: "Set per docs/ENVIRONMENT-VARIABLES.md.",
      });
    }
  }

  const adminHostConfigured =
    typeof process.env.OWNER_ALLOWED_HOSTS === "string" && process.env.OWNER_ALLOWED_HOSTS.trim() !== "";
  if (!adminHostConfigured) {
    blockers.push({
      title: "Dedicated platform admin host not deployed",
      component: "Platform Admin",
      severity: "warning",
      recommendation: `Use /platform-admin fallback until ${PLATFORM_ADMIN_PREFERRED_HOST} is routed.`,
    });
  }

  for (const card of components.filter((c) => c.status === "unavailable")) {
    if (blockers.some((b) => b.component === card.name)) continue;
    blockers.push({
      title: `${card.name} unavailable`,
      component: card.name,
      severity: "warning",
      recommendation: card.details,
    });
  }

  return blockers;
}

function deriveKnownRisks(probes: LiveProbeBundle, components: QualityComponentCard[]): QualityBlocker[] {
  const risks: QualityBlocker[] = [];
  const release = probes.releaseEnv.data;

  for (const card of components.filter((c) => c.status === "degraded")) {
    risks.push({
      title: `${card.name} degraded`,
      component: card.name,
      severity: "warning",
      recommendation: card.details,
    });
  }
  if (release && !release.aiConfigured) {
    risks.push({
      title: "AI provider not fully configured",
      component: "AI",
      severity: "warning",
      recommendation: "Set OPENAI_API_KEY or alternate vision provider keys.",
    });
  }
  if (release && !release.billingConfigured) {
    risks.push({
      title: "Stripe billing not fully configured",
      component: "Billing",
      severity: "information",
      recommendation: "Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET when live billing is required.",
    });
  }
  if (probes.cloudflare.connected && probes.cloudflare.data?.externalHealthOk === false) {
    risks.push({
      title: "External edge health probe failed",
      component: "Cloudflare",
      severity: "warning",
      recommendation: probes.cloudflare.summary,
    });
  }
  if (probes.featureFlags.connected === false) {
    risks.push({
      title: "Global feature flags inventory unavailable",
      component: "Release",
      severity: "information",
      recommendation: probes.featureFlags.summary,
    });
  }

  return risks;
}

function buildPlatformTimeline(probes: LiveProbeBundle): PlatformTimelineEvent[] {
  const git = probes.gitMetadata.data;
  const health = probes.health.data;
  const migrations = probes.migrations.data;
  const audit = probes.platformAudit.data;

  return [
    {
      id: "last_deploy",
      label: "Last deployment",
      timestamp: health?.buildTime ?? git?.buildTime ?? null,
      displayValue: health?.buildTime ?? git?.buildTime ?? "Unknown",
      source: "build stamp env",
    },
    {
      id: "last_migration",
      label: "Last migration",
      timestamp: migrations?.latestVersion ? probes.checkedAt : null,
      displayValue: migrations?.latestVersion ?? "Unavailable",
      source: "supabase_migrations.schema_migrations",
    },
    {
      id: "last_build",
      label: "Last build",
      timestamp: health?.buildTime ?? null,
      displayValue: health?.buildSha7 ?? git?.sha?.slice(0, 7) ?? "Unknown",
      source: "health / build stamp",
    },
    {
      id: "last_audit",
      label: "Last audit",
      timestamp: audit?.latestAt ?? null,
      displayValue: audit?.latestAt
        ? `${audit.latestAction ?? "event"} @ ${audit.latestAt}`
        : probes.platformAudit.connected
          ? "No entries"
          : "Unavailable",
      source: "platform_owner_audit_log",
    },
    {
      id: "last_restart",
      label: "Last restart",
      timestamp: null,
      displayValue: "Unavailable",
      source: "no runtime probe",
    },
  ];
}

function buildDomainSections(
  probes: LiveProbeBundle,
  overallHealth: QualityStatus,
  releaseLevel: ReadinessLevel
): DomainSection[] {
  const health = probes.health.data;
  const release = probes.releaseEnv.data;
  const ai = probes.ai.data;
  const mobile = probes.mobile.data;

  return [
    {
      id: "platform_health",
      label: "Platform Health",
      status: overallHealth,
      statusLabel: statusLabel(overallHealth),
      summary: probes.health.summary,
      highlights: [
        `Core API ok=${String(health?.ok)}`,
        `System health=${probes.systemHealth.data?.status ?? "unavailable"}`,
      ],
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      status:
        health?.db === "ok" && probes.storage.data?.status === "healthy"
          ? "healthy"
          : health?.db === "ok"
            ? "degraded"
            : "unavailable",
      statusLabel: statusLabel(
        health?.db === "ok" && probes.storage.data?.status === "healthy"
          ? "healthy"
          : health?.db === "ok"
            ? "degraded"
            : "unavailable"
      ),
      summary: `DB=${health?.db ?? "unknown"}; storage=${probes.storage.data?.status ?? "unavailable"}.`,
      highlights: [
        probes.migrations.summary,
        probes.featureFlags.summary,
      ],
    },
    {
      id: "security",
      label: "Security",
      status:
        release?.verdict === "FAIL" || (release?.forbiddenInProdSet.length ?? 0) > 0
          ? "unavailable"
          : release?.verdict === "PASS"
            ? "healthy"
            : "degraded",
      statusLabel: statusLabel(
        release?.verdict === "FAIL" || (release?.forbiddenInProdSet.length ?? 0) > 0
          ? "unavailable"
          : release?.verdict === "PASS"
            ? "healthy"
            : "degraded"
      ),
      summary: release ? `Release env verdict: ${release.verdict}.` : "Release env probe unavailable.",
      highlights: [probes.platformAudit.summary],
    },
    {
      id: "ai",
      label: "AI",
      status: ai?.openai || ai?.visionProviders.length
        ? probes.systemHealth.data?.services.ai_brain === "ok"
          ? "healthy"
          : "degraded"
        : "not_configured",
      statusLabel: statusLabel(
        ai?.openai || ai?.visionProviders.length
          ? probes.systemHealth.data?.services.ai_brain === "ok"
            ? "healthy"
            : "degraded"
          : "not_configured"
      ),
      summary: probes.ai.summary,
      highlights: [
        `Vision providers: ${ai?.visionProviders.join(", ") || "none"}`,
        `Copilot model: ${ai?.copilotModel ?? "unknown"}`,
      ],
    },
    {
      id: "mobile",
      label: "Mobile",
      status: "unknown",
      statusLabel: statusLabel("unknown"),
      summary: probes.mobile.summary,
      highlights: [
        `iOS build=${mobile?.iosBuildNumber ?? "unknown"}`,
        `Android versionCode=${mobile?.androidVersionCode ?? "unknown"}`,
      ],
    },
    {
      id: "deployments",
      label: "Deployments",
      status: probes.cloudflare.connected
        ? probes.cloudflare.data?.externalHealthOk
          ? "healthy"
          : "degraded"
        : "unknown",
      statusLabel: statusLabel(
        probes.cloudflare.connected
          ? probes.cloudflare.data?.externalHealthOk
            ? "healthy"
            : "degraded"
          : "unknown"
      ),
      summary: probes.cloudflare.summary,
      highlights: [
        `Branch=${probes.gitMetadata.data?.branch ?? "unknown"}`,
        `GitHub workflow=${probes.gitMetadata.data?.githubWorkflow ?? "unavailable"}`,
      ],
    },
    {
      id: "release",
      label: "Release",
      status:
        releaseLevel === "ready" ? "healthy" : releaseLevel === "partial" ? "degraded" : "unavailable",
      statusLabel: statusLabel(
        releaseLevel === "ready" ? "healthy" : releaseLevel === "partial" ? "degraded" : "unavailable"
      ),
      summary: probes.billing.summary,
      highlights: [
        probes.billing.summary,
        probes.platformIntegration.billingPlatform.connected
          ? `Entitlements rows=${probes.platformIntegration.billingPlatform.data?.entitlementsRowCount ?? "unknown"}`
          : "Billing inventory unavailable",
      ],
    },
    {
      id: "platform",
      label: "Platform",
      status: probes.platformIntegration.platformOverview.connected ? "healthy" : "unknown",
      statusLabel: statusLabel(
        probes.platformIntegration.platformOverview.connected ? "healthy" : "unknown"
      ),
      summary: probes.platformIntegration.platformOverview.summary,
      highlights: [
        `Tenants=${probes.platformIntegration.platformOverview.data?.totalTenants ?? "unknown"}`,
        `Projects=${probes.platformIntegration.platformOverview.data?.totalProjects ?? "unknown"}`,
      ],
    },
  ];
}

function buildSystemComponents(probes: LiveProbeBundle, generatedAt: string): QualityComponentCard[] {
  const health = probes.health.data;
  const healthOk = health?.ok === true;
  const dbOk = health?.db === "ok";
  const ai = probes.ai.data;
  const mobile = probes.mobile.data;
  const storage = probes.storage.data;
  const release = probes.releaseEnv.data;
  const publicConfig = getPublicConfig();

  const mapService = (name: string): QualityStatus => {
    const s = probes.systemHealth.data?.services[name];
    if (!s) return "unknown";
    if (s === "ok") return "healthy";
    if (s === "degraded") return "degraded";
    if (s === "error") return "unavailable";
    return "not_configured";
  };

  const telegramConfigured =
    Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) &&
    Boolean(
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || process.env.TELEGRAM_BOT_USERNAME?.trim()
    );

  return [
    {
      id: "website",
      name: "Website",
      status: healthOk ? "healthy" : "unavailable",
      statusLabel: statusLabel(healthOk ? "healthy" : "unavailable"),
      lastCheck: generatedAt,
      details: probes.health.summary,
    },
    {
      id: "web_dashboard",
      name: "Web Dashboard",
      status: dbOk && hasSupabaseEnv() ? "healthy" : hasSupabaseEnv() ? "degraded" : "not_configured",
      statusLabel: statusLabel(dbOk && hasSupabaseEnv() ? "healthy" : hasSupabaseEnv() ? "degraded" : "not_configured"),
      lastCheck: generatedAt,
      details: hasSupabaseEnv() ? "Dashboard prerequisites probed via Supabase." : "Supabase env missing.",
    },
    {
      id: "backend_api",
      name: "Backend API",
      status: healthOk ? "healthy" : "unavailable",
      statusLabel: statusLabel(healthOk ? "healthy" : "unavailable"),
      lastCheck: generatedAt,
      details: health ? `HTTP ${health.status}; ok=${String(health.ok)}.` : probes.health.summary,
    },
    {
      id: "database",
      name: "Database",
      status: dbOk ? "healthy" : hasSupabaseEnv() ? "unavailable" : "not_configured",
      statusLabel: statusLabel(dbOk ? "healthy" : hasSupabaseEnv() ? "unavailable" : "not_configured"),
      lastCheck: generatedAt,
      details: probes.migrations.connected
        ? `${probes.health.summary} ${probes.migrations.summary}`
        : probes.health.summary,
    },
    {
      id: "storage",
      name: "Storage",
      status:
        storage?.status === "healthy"
          ? "healthy"
          : storage?.status === "degraded"
            ? "degraded"
            : storage?.status === "not_configured"
              ? "not_configured"
              : "unavailable",
      statusLabel: statusLabel(
        storage?.status === "healthy"
          ? "healthy"
          : storage?.status === "degraded"
            ? "degraded"
            : storage?.status === "not_configured"
              ? "not_configured"
              : "unavailable"
      ),
      lastCheck: generatedAt,
      details: storage?.details ?? probes.storage.summary,
    },
    {
      id: "authentication",
      name: "Authentication",
      status: hasSupabaseEnv() ? (dbOk ? "healthy" : "degraded") : "not_configured",
      statusLabel: statusLabel(hasSupabaseEnv() ? (dbOk ? "healthy" : "degraded") : "not_configured"),
      lastCheck: generatedAt,
      details: `Service role ${health?.serviceRoleConfigured ? "configured" : "missing"}.`,
    },
    {
      id: "notifications",
      name: "Notifications",
      status: (() => {
        const push = probes.platformIntegration.pushOutbox;
        if (push.connected && push.data) {
          if ((push.data.failedCount ?? 0) > 0) return "degraded";
          if ((push.data.pendingCount ?? 0) > 0) return "degraded";
          if (push.data.fcmConfigured || push.data.telegramConfigured || release?.pushConfigured) {
            return "healthy";
          }
          return "not_configured";
        }
        if (release?.pushConfigured) return "unknown";
        if (telegramConfigured) return "unknown";
        return "not_configured";
      })(),
      statusLabel: statusLabel(
        (() => {
          const push = probes.platformIntegration.pushOutbox;
          if (push.connected && push.data) {
            if ((push.data.failedCount ?? 0) > 0) return "degraded";
            if ((push.data.pendingCount ?? 0) > 0) return "degraded";
            if (push.data.fcmConfigured || push.data.telegramConfigured || release?.pushConfigured) {
              return "healthy";
            }
            return "not_configured";
          }
          if (release?.pushConfigured) return "unknown";
          if (telegramConfigured) return "unknown";
          return "not_configured";
        })()
      ),
      lastCheck: generatedAt,
      details: probes.platformIntegration.pushOutbox.connected
        ? probes.platformIntegration.pushOutbox.summary
        : release
          ? `Push env=${String(release.pushConfigured)}; Telegram widget=${String(telegramConfigured)}.`
          : "Notification evidence unavailable.",
    },
    {
      id: "ai",
      name: "AI",
      status: ai?.openai || (ai?.visionProviders.length ?? 0) > 0 ? mapService("ai_brain") : "not_configured",
      statusLabel: statusLabel(
        ai?.openai || (ai?.visionProviders.length ?? 0) > 0 ? mapService("ai_brain") : "not_configured"
      ),
      lastCheck: generatedAt,
      details: probes.ai.summary,
    },
    {
      id: "cloudflare",
      name: "Cloudflare",
      status: probes.cloudflare.connected
        ? probes.cloudflare.data?.externalHealthOk
          ? "healthy"
          : "degraded"
        : "unknown",
      statusLabel: statusLabel(
        probes.cloudflare.connected
          ? probes.cloudflare.data?.externalHealthOk
            ? "healthy"
            : "degraded"
          : "unknown"
      ),
      lastCheck: generatedAt,
      details: probes.cloudflare.summary,
    },
    {
      id: "supabase",
      name: "Supabase",
      status: health?.supabaseReachable ? (dbOk ? "healthy" : "degraded") : hasSupabaseEnv() ? "unavailable" : "not_configured",
      statusLabel: statusLabel(
        health?.supabaseReachable ? (dbOk ? "healthy" : "degraded") : hasSupabaseEnv() ? "unavailable" : "not_configured"
      ),
      lastCheck: generatedAt,
      details: `Reachable=${String(health?.supabaseReachable)}; DB=${health?.db ?? "unknown"}.`,
    },
    {
      id: "android",
      name: "Android",
      status: "unknown",
      statusLabel: statusLabel("unknown"),
      lastCheck: generatedAt,
      details: mobile?.androidVersionCode || mobile?.androidWorkerUrl || mobile?.androidManagerUrl
        ? `Metadata only — versionCode=${mobile.androidVersionCode ?? "unknown"}; no live health probe.`
        : probes.mobile.summary,
    },
    {
      id: "ios",
      name: "iOS",
      status: "unknown",
      statusLabel: statusLabel("unknown"),
      lastCheck: generatedAt,
      details: mobile?.iosBuildNumber || mobile?.iosWorkerUrl || mobile?.iosManagerUrl
        ? `Metadata only — buildNumber=${mobile.iosBuildNumber ?? "unknown"}; no live health probe.`
        : probes.mobile.summary,
    },
  ];
}

function buildPlatformOverviewMetrics(probes: LiveProbeBundle): PlatformOverviewMetrics {
  const overview = probes.platformIntegration.platformOverview;
  const push = probes.platformIntegration.pushOutbox;
  const billing = probes.platformIntegration.billingPlatform;

  if (overview.error === "service_role_missing") {
    return {
      evidenceStatus: "not_configured",
      summary: "SUPABASE_SERVICE_ROLE_KEY missing — platform metrics unavailable.",
      totalTenants: null,
      activeUsers: null,
      totalProjects: null,
      pendingInvites: null,
      openSupportEvents: null,
      pushPending: null,
      pushFailed: null,
      pushSent24h: null,
      entitlementsRows: null,
      billingCustomers: null,
    };
  }

  if (!overview.connected || !overview.data) {
    return {
      evidenceStatus: "unavailable",
      summary: overview.summary,
      totalTenants: null,
      activeUsers: null,
      totalProjects: null,
      pendingInvites: null,
      openSupportEvents: null,
      pushPending: push.data?.pendingCount ?? null,
      pushFailed: push.data?.failedCount ?? null,
      pushSent24h: push.data?.sentCount24h ?? null,
      entitlementsRows: billing.data?.entitlementsRowCount ?? null,
      billingCustomers: billing.data?.billingCustomersCount ?? null,
    };
  }

  return {
    evidenceStatus: "live",
    summary: overview.summary,
    totalTenants: overview.data.totalTenants,
    activeUsers: overview.data.activeUsers,
    totalProjects: overview.data.totalProjects,
    pendingInvites: overview.data.pendingInvites,
    openSupportEvents: overview.data.openSupportEvents,
    pushPending: push.data?.pendingCount ?? null,
    pushFailed: push.data?.failedCount ?? null,
    pushSent24h: push.data?.sentCount24h ?? null,
    entitlementsRows: billing.data?.entitlementsRowCount ?? null,
    billingCustomers: billing.data?.billingCustomersCount ?? null,
  };
}

function buildDataCoverageSection(probes: LiveProbeBundle): DataCoverage {
  const { sources, coveragePercent } = buildDataCoverage(probes);
  const available = sources.filter((s) => s.status === "connected");
  const unavailable = sources.filter((s) => s.status === "unavailable");
  return {
    lastRefresh: probes.checkedAt,
    coveragePercent,
    connectedCount: available.length,
    totalCatalogCount: sources.length,
    available,
    unavailable,
  };
}

function assembleDashboard(probes: LiveProbeBundle): RomaQualityDashboard {
  const generatedAt = probes.checkedAt;
  const publicConfig = getPublicConfig();
  const health = probes.health.data;
  const release = probes.releaseEnv.data;
  const healthOk = health?.ok === true;
  const dbOk = health?.db === "ok";
  const buildSha7 = health?.buildSha7 ?? null;
  const deployTime = health?.buildTime ?? probes.gitMetadata.data?.buildTime ?? null;

  const overallHealth: QualityStatus = healthOk
    ? probes.systemHealth.data?.status === "degraded"
      ? "degraded"
      : "healthy"
    : health?.db === "error"
      ? "unavailable"
      : "degraded";

  const systemComponents = buildSystemComponents(probes, generatedAt);

  const frontendLevel: ReadinessLevel = healthOk && buildSha7 ? "ready" : healthOk ? "partial" : "blocked";
  const backendLevel: ReadinessLevel =
    healthOk && health?.serviceRoleConfigured ? "ready" : healthOk ? "partial" : "blocked";
  const databaseLevel: ReadinessLevel = dbOk ? "ready" : hasSupabaseEnv() ? "blocked" : "unknown";
  const mobileLevel: ReadinessLevel = "unknown";
  const aiLevel: ReadinessLevel =
    probes.ai.data?.openai || (probes.ai.data?.visionProviders.length ?? 0) > 0 ? "ready" : "partial";
  const securityLevel: ReadinessLevel =
    release?.verdict === "FAIL"
      ? "blocked"
      : (release?.forbiddenInProdSet.length ?? 0) > 0
        ? "blocked"
        : release?.cronConfigured
          ? "ready"
          : "partial";

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
      summary: health?.serviceRoleConfigured
        ? "API health and service role configured."
        : "API reachable; service role missing.",
    },
    {
      id: "database",
      label: "Database",
      level: databaseLevel,
      percent: readinessPercent(databaseLevel),
      summary: probes.migrations.summary,
    },
    {
      id: "mobile",
      label: "Mobile",
      level: mobileLevel,
      percent: readinessPercent(mobileLevel),
      summary: probes.mobile.summary,
    },
    {
      id: "ai",
      label: "AI",
      level: aiLevel,
      percent: readinessPercent(aiLevel),
      summary: probes.ai.summary,
    },
    {
      id: "security",
      label: "Security",
      level: securityLevel,
      percent: readinessPercent(securityLevel),
      summary: release ? `Release env verdict: ${release.verdict}.` : "Unavailable",
    },
    {
      id: "performance",
      label: "Performance",
      level: "unknown",
      percent: null,
      summary: "No live performance telemetry source wired.",
    },
    {
      id: "documentation",
      label: "Documentation",
      level: "partial",
      percent: 50,
      summary: "Audit report references available; no runtime doc index.",
    },
  ];

  const releasePercent = averagePercent(releaseReadiness);
  const releaseLevel = readinessFromPercent(releasePercent);
  const dataCoverage = buildDataCoverageSection(probes);
  const recommendations = deriveRecommendations(probes);

  const adminHostConfigured =
    typeof process.env.OWNER_ALLOWED_HOSTS === "string" && process.env.OWNER_ALLOWED_HOSTS.trim() !== "";

  return {
    pageMode: "read_only",
    testExecutionEnabled: false,
    generatedAt,
    environment: {
      label: resolveEnvironmentLabel(),
      appUrl: publicConfig.NEXT_PUBLIC_APP_URL || null,
      nodeEnv: process.env.NODE_ENV ?? null,
      preferredAdminHost: PLATFORM_ADMIN_PREFERRED_HOST,
      adminHostDeployed: adminHostConfigured ? null : false,
    },
    platformStatus: {
      overallHealth,
      overallHealthLabel: statusLabel(overallHealth),
      releaseReadiness: releaseLevel,
      releaseReadinessPercent: releasePercent,
      lastUpdated: generatedAt,
    },
    domainSections: buildDomainSections(probes, overallHealth, releaseLevel),
    systemComponents,
    releaseReadiness,
    knownRisks: deriveKnownRisks(probes, systemComponents),
    blockers: deriveBlockers(probes, systemComponents),
    recommendations,
    latestChanges: {
      lastDeploy: deployTime,
      lastCommit: buildSha7,
      branch: probes.gitMetadata.data?.branch ?? null,
      build: buildSha7,
      timestamp: deployTime ?? generatedAt,
    },
    platformTimeline: buildPlatformTimeline(probes),
    dataCoverage,
    platformOverview: buildPlatformOverviewMetrics(probes),
    romaStatus: [
      {
        id: "architecture",
        label: "Architecture",
        level: probes.systemHealth.connected
          ? probes.systemHealth.data?.status === "ok"
            ? "ready"
            : "partial"
          : "unknown",
        summary: probes.systemHealth.summary,
        source: probes.systemHealth.connected ? "live" : "unavailable",
      },
      {
        id: "governance",
        label: "Governance",
        level: release?.verdict === "FAIL" ? "blocked" : "ready",
        summary: release ? `Release env: ${release.verdict}.` : "Unavailable",
        source: release ? "live" : "unavailable",
      },
      {
        id: "platform",
        label: "Platform",
        level: healthOk && dbOk ? "ready" : "partial",
        summary: `Data coverage ${dataCoverage.coveragePercent}%.`,
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
        level:
          probes.billing.data?.adapter.configValid && (probes.ai.data?.openai || (probes.ai.data?.visionProviders.length ?? 0) > 0)
            ? "partial"
            : "blocked",
        summary: probes.billing.summary,
        source: "live",
      },
    ],
    knownReports: buildKnownReports(),
    dataSources: {
      available: dataCoverage.available.map((s) => s.label),
      unavailable: dataCoverage.unavailable.map((s) => s.label),
    },
  };
}

function buildFallbackDashboard(error: string): RomaQualityDashboard {
  const generatedAt = new Date().toISOString();
  const emptyCoverage: DataCoverage = {
    lastRefresh: generatedAt,
    coveragePercent: 0,
    connectedCount: 0,
    totalCatalogCount: 0,
    available: [],
    unavailable: [],
  };
  return {
    pageMode: "read_only",
    testExecutionEnabled: false,
    generatedAt,
    environment: {
      label: "Unknown",
      appUrl: null,
      nodeEnv: process.env.NODE_ENV ?? null,
      preferredAdminHost: PLATFORM_ADMIN_PREFERRED_HOST,
      adminHostDeployed: null,
    },
    platformStatus: {
      overallHealth: "unavailable",
      overallHealthLabel: "Unavailable",
      releaseReadiness: "unknown",
      releaseReadinessPercent: null,
      lastUpdated: generatedAt,
    },
    domainSections: [],
    systemComponents: [],
    releaseReadiness: [],
    knownRisks: [],
    blockers: [
      {
        title: "Dashboard aggregation failed",
        component: "Platform",
        severity: "critical",
        recommendation: error,
      },
    ],
    recommendations: [],
    latestChanges: {
      lastDeploy: null,
      lastCommit: null,
      branch: null,
      build: null,
      timestamp: null,
    },
    platformTimeline: [],
    dataCoverage: emptyCoverage,
    platformOverview: {
      evidenceStatus: "unavailable",
      summary: "Dashboard aggregation failed.",
      totalTenants: null,
      activeUsers: null,
      totalProjects: null,
      pendingInvites: null,
      openSupportEvents: null,
      pushPending: null,
      pushFailed: null,
      pushSent24h: null,
      entitlementsRows: null,
      billingCustomers: null,
    },
    romaStatus: [],
    knownReports: buildKnownReports(),
    dataSources: { available: [], unavailable: [] },
  };
}

export async function buildRomaQualityDashboard(): Promise<RomaQualityDashboard> {
  try {
    const probes = await runLiveProbes();
    return assembleDashboard(probes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "dashboard_build_error";
    return buildFallbackDashboard(message);
  }
}

/** Build dashboard from an existing probe bundle (single probe pass — safe audit). */
export function buildRomaQualityDashboardFromProbes(probes: LiveProbeBundle): RomaQualityDashboard {
  return assembleDashboard(probes);
}
