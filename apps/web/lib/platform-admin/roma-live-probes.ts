/**
 * Safe read-only live probes for ROMA operations center.
 * Each probe fails closed — never throws to callers.
 */

import { getHealthResponse } from "@/lib/controllers/health";
import { getPublicConfig, getBuildStamp } from "@/lib/config";
import { validateReleaseEnv } from "@/lib/config/release-env";
import {
  getConfiguredVisionProviders,
  getServerConfig,
  isAiJobConfigured,
  isGeminiConfigured,
  isOpenAIConfigured,
} from "@/lib/config/server";
import { getSystemHealth } from "@/lib/system/health.service";
import { getBillingAdapterDiagnostics } from "@/lib/platform/billing-readiness/billing-adapter-registry";
import {
  getBillingProviderRuntimeConfig,
  getStripeWebhookIngressConfig,
} from "@/lib/platform/billing-readiness/billing-provider-config";
import { getStripePriceMappingDiagnostics } from "@/lib/platform/billing-readiness/stripe-price-mapping";
import { listFlags } from "@/lib/platform/flags/flags.repository";
import { getAdminClient } from "@/lib/supabase/admin";
import type { LiveDataSource, LiveSourceStatus } from "./roma-quality-dashboard.types";

const UPLOAD_BUCKET = "media";

export type ProbeOutcome<T> = {
  connected: boolean;
  summary: string;
  data: T | null;
  error: string | null;
};

export type HealthProbeData = {
  status: number;
  ok: boolean;
  db: string;
  aiConfigured: boolean;
  openaiConfigured: boolean;
  supabaseReachable: boolean;
  serviceRoleConfigured: boolean;
  buildSha7: string | null;
  buildTime: string | null;
  reason: string | null;
};

export type SystemHealthProbeData = {
  status: string;
  timestamp: string;
  services: Record<string, string>;
};

export type ReleaseEnvProbeData = ReturnType<typeof validateReleaseEnv>;

export type GitMetadataProbeData = {
  branch: string | null;
  sha: string | null;
  buildTime: string | null;
  githubRunId: string | null;
  githubWorkflow: string | null;
  githubRepository: string | null;
  githubEvent: string | null;
};

export type StorageProbeData = {
  status: "healthy" | "degraded" | "unavailable" | "not_configured";
  bucketCount: number | null;
  hasMediaBucket: boolean;
  details: string;
};

export type FeatureFlagsProbeData = {
  count: number;
  keys: string[];
};

export type MigrationProbeData = {
  latestVersion: string | null;
  migrationCount: number | null;
};

export type AuditProbeData = {
  latestAction: string | null;
  latestAt: string | null;
};

export type BillingProbeData = {
  adapter: ReturnType<typeof getBillingAdapterDiagnostics>;
  runtime: ReturnType<typeof getBillingProviderRuntimeConfig>;
  priceMappingsConfigured: number;
  priceMappingsTotal: number;
  webhookIngress: ReturnType<typeof getStripeWebhookIngressConfig>;
};

export type AiProbeData = {
  openai: boolean;
  aiJob: boolean;
  visionProviders: string[];
  gemini: boolean;
  copilotModel: string;
};

export type CloudflareProbeData = {
  appUrl: string | null;
  externalHealthOk: boolean | null;
  externalBuildSha7: string | null;
  runtimeHint: string | null;
};

export type MobileProbeData = {
  iosWorkerUrl: string | null;
  iosManagerUrl: string | null;
  androidWorkerUrl: string | null;
  androidManagerUrl: string | null;
  androidVersionCode: string | null;
  iosBuildNumber: string | null;
};

export type LiveProbeBundle = {
  checkedAt: string;
  health: ProbeOutcome<HealthProbeData>;
  systemHealth: ProbeOutcome<SystemHealthProbeData>;
  releaseEnv: ProbeOutcome<ReleaseEnvProbeData>;
  gitMetadata: ProbeOutcome<GitMetadataProbeData>;
  storage: ProbeOutcome<StorageProbeData>;
  featureFlags: ProbeOutcome<FeatureFlagsProbeData>;
  migrations: ProbeOutcome<MigrationProbeData>;
  platformAudit: ProbeOutcome<AuditProbeData>;
  billing: ProbeOutcome<BillingProbeData>;
  ai: ProbeOutcome<AiProbeData>;
  cloudflare: ProbeOutcome<CloudflareProbeData>;
  mobile: ProbeOutcome<MobileProbeData>;
};

export const LIVE_SOURCE_CATALOG = [
  { id: "core_health", label: "Core health API", category: "Platform Health" },
  { id: "system_health", label: "System health service", category: "Infrastructure" },
  { id: "release_env", label: "Release environment validation", category: "Security" },
  { id: "git_metadata", label: "Git / build metadata", category: "Deployments" },
  { id: "supabase_db", label: "Supabase database probe", category: "Infrastructure" },
  { id: "supabase_storage", label: "Supabase storage probe", category: "Infrastructure" },
  { id: "feature_flags_db", label: "Global feature flags (DB)", category: "Release" },
  { id: "db_migrations", label: "Database migrations", category: "Infrastructure" },
  { id: "platform_audit_log", label: "Platform audit log", category: "Security" },
  { id: "billing_diagnostics", label: "Billing adapter diagnostics", category: "Release" },
  { id: "ai_configuration", label: "AI provider configuration", category: "AI" },
  { id: "cloudflare_deploy", label: "Cloudflare deployment probe", category: "Deployments" },
  { id: "mobile_metadata", label: "Mobile build metadata", category: "Mobile" },
  { id: "github_actions_env", label: "GitHub Actions metadata", category: "Deployments" },
  { id: "notification_config", label: "Notification services config", category: "Infrastructure" },
] as const;

function resolveDeployBranch(): string | null {
  return (
    (process.env.VERCEL_GIT_COMMIT_REF ?? "").trim() ||
    (process.env.GITHUB_REF_NAME ?? "").trim() ||
    (process.env.GITHUB_HEAD_REF ?? "").trim() ||
    null
  );
}

async function probeHealth(): Promise<ProbeOutcome<HealthProbeData>> {
  try {
    const result = await getHealthResponse();
    const body = result.body as Record<string, unknown>;
    const buildStamp = body.buildStamp as { sha7?: string; buildTime?: string } | undefined;
    const { sha, buildTime } = getBuildStamp();
    return {
      connected: true,
      summary: `HTTP ${result.status}; ok=${String(body.ok)}; db=${String(body.db ?? "unknown")}.`,
      data: {
        status: result.status,
        ok: body.ok === true,
        db: String(body.db ?? "unknown"),
        aiConfigured: body.aiConfigured === true,
        openaiConfigured: body.openaiConfigured === true,
        supabaseReachable: body.supabaseReachable === true,
        serviceRoleConfigured: body.serviceRoleConfigured === true,
        buildSha7: buildStamp?.sha7 ?? (sha ? sha.slice(0, 7) : null),
        buildTime: (buildStamp?.buildTime ?? buildTime) || null,
        reason: typeof body.reason === "string" ? body.reason : null,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Health probe failed.",
      data: null,
      error: err instanceof Error ? err.message : "health_probe_error",
    };
  }
}

async function probeSystemHealth(): Promise<ProbeOutcome<SystemHealthProbeData>> {
  try {
    const result = await getSystemHealth();
    return {
      connected: true,
      summary: `System status=${result.status}.`,
      data: {
        status: result.status,
        timestamp: result.timestamp,
        services: result.services,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "System health service unavailable.",
      data: null,
      error: err instanceof Error ? err.message : "system_health_error",
    };
  }
}

function probeReleaseEnv(): ProbeOutcome<ReleaseEnvProbeData> {
  try {
    const result = validateReleaseEnv();
    return {
      connected: true,
      summary: `Verdict=${result.verdict}; AI=${result.aiConfigured}; billing=${result.billingConfigured}.`,
      data: result,
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Release env validation failed.",
      data: null,
      error: err instanceof Error ? err.message : "release_env_error",
    };
  }
}

function probeGitMetadata(): ProbeOutcome<GitMetadataProbeData> {
  try {
    const { sha, buildTime } = getBuildStamp();
    const githubRunId = (process.env.GITHUB_RUN_ID ?? "").trim() || null;
    const githubWorkflow = (process.env.GITHUB_WORKFLOW ?? "").trim() || null;
    const githubRepository = (process.env.GITHUB_REPOSITORY ?? "").trim() || null;
    const githubEvent = (process.env.GITHUB_EVENT_NAME ?? "").trim() || null;
    const hasGithub = Boolean(githubRunId || githubWorkflow || githubRepository);
    return {
      connected: true,
      summary: hasGithub
        ? `GitHub Actions context present (workflow=${githubWorkflow ?? "unknown"}).`
        : `Build stamp ${sha ? sha.slice(0, 7) : "missing"}; branch=${resolveDeployBranch() ?? "unknown"}.`,
      data: {
        branch: resolveDeployBranch(),
        sha: sha || null,
        buildTime: buildTime || null,
        githubRunId,
        githubWorkflow,
        githubRepository,
        githubEvent,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Git metadata unavailable.",
      data: null,
      error: err instanceof Error ? err.message : "git_metadata_error",
    };
  }
}

async function probeStorage(): Promise<ProbeOutcome<StorageProbeData>> {
  const admin = getAdminClient();
  if (!admin) {
    return {
      connected: false,
      summary: "Service role not configured — storage probe skipped.",
      data: {
        status: "not_configured",
        bucketCount: null,
        hasMediaBucket: false,
        details: "SUPABASE_SERVICE_ROLE_KEY missing.",
      },
      error: "service_role_missing",
    };
  }
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      return {
        connected: false,
        summary: `Storage API error: ${error.message}`,
        data: {
          status: "unavailable",
          bucketCount: null,
          hasMediaBucket: false,
          details: error.message,
        },
        error: error.message,
      };
    }
    const buckets = data ?? [];
    const hasMediaBucket = buckets.some((b) => b.name === UPLOAD_BUCKET);
    return {
      connected: true,
      summary: hasMediaBucket
        ? `${buckets.length} bucket(s); "${UPLOAD_BUCKET}" present.`
        : `${buckets.length} bucket(s); "${UPLOAD_BUCKET}" missing.`,
      data: {
        status: hasMediaBucket ? "healthy" : "degraded",
        bucketCount: buckets.length,
        hasMediaBucket,
        details: hasMediaBucket
          ? `Supabase storage reachable; "${UPLOAD_BUCKET}" bucket present.`
          : `Buckets reachable but "${UPLOAD_BUCKET}" not found.`,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "storage_probe_failed";
    return {
      connected: false,
      summary: message,
      data: { status: "unavailable", bucketCount: null, hasMediaBucket: false, details: message },
      error: message,
    };
  }
}

async function probeFeatureFlags(): Promise<ProbeOutcome<FeatureFlagsProbeData>> {
  const admin = getAdminClient();
  if (!admin) {
    return {
      connected: false,
      summary: "Service role required for feature flag inventory.",
      data: null,
      error: "service_role_missing",
    };
  }
  try {
    const flags = await listFlags(admin);
    return {
      connected: true,
      summary: `${flags.length} global feature flag(s) loaded.`,
      data: { count: flags.length, keys: flags.map((f) => f.key).slice(0, 20) },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Feature flag probe failed.",
      data: null,
      error: err instanceof Error ? err.message : "feature_flags_error",
    };
  }
}

async function probeMigrations(): Promise<ProbeOutcome<MigrationProbeData>> {
  const admin = getAdminClient();
  if (!admin) {
    return {
      connected: false,
      summary: "Service role required for migration probe.",
      data: null,
      error: "service_role_missing",
    };
  }
  try {
    // Supabase generated types omit supabase_migrations; runtime probe only.
    const { data, error } = await (
      admin as unknown as {
        schema: (schemaName: string) => ReturnType<NonNullable<ReturnType<typeof getAdminClient>>["schema"]>;
      }
    )
      .schema("supabase_migrations")
      .from("schema_migrations")
      .select("version")
      .order("version", { ascending: false })
      .limit(50);
    if (error) {
      return {
        connected: false,
        summary: `Migration table probe failed: ${error.message}`,
        data: null,
        error: error.message,
      };
    }
    const rows = (data ?? []) as Array<{ version: string }>;
    return {
      connected: true,
      summary: rows.length > 0 ? `Latest migration ${rows[0]?.version ?? "unknown"}.` : "No migrations recorded.",
      data: {
        latestVersion: rows[0]?.version ?? null,
        migrationCount: rows.length,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Migration probe unavailable.",
      data: null,
      error: err instanceof Error ? err.message : "migrations_error",
    };
  }
}

async function probePlatformAudit(): Promise<ProbeOutcome<AuditProbeData>> {
  const admin = getAdminClient();
  if (!admin) {
    return {
      connected: false,
      summary: "Service role required for platform audit log.",
      data: null,
      error: "service_role_missing",
    };
  }
  try {
    const { data, error } = await admin
      .from("platform_owner_audit_log")
      .select("action, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      return {
        connected: false,
        summary: `Audit log probe failed: ${error.message}`,
        data: null,
        error: error.message,
      };
    }
    const row = data as { action?: string; created_at?: string } | null;
    return {
      connected: true,
      summary: row?.created_at
        ? `Latest audit: ${row.action ?? "unknown"} at ${row.created_at}.`
        : "Audit log reachable; no entries.",
      data: {
        latestAction: row?.action ?? null,
        latestAt: row?.created_at ?? null,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Platform audit probe unavailable.",
      data: null,
      error: err instanceof Error ? err.message : "audit_error",
    };
  }
}

function probeBilling(): ProbeOutcome<BillingProbeData> {
  try {
    const adapter = getBillingAdapterDiagnostics();
    const runtime = getBillingProviderRuntimeConfig();
    const priceMap = getStripePriceMappingDiagnostics();
    const priceValues = Object.values(priceMap);
    const priceMappingsConfigured = priceValues.filter((v) => v !== null).length;
    const webhookIngress = getStripeWebhookIngressConfig();
    return {
      connected: true,
      summary: `Adapter=${adapter.activeAdapterKind}; flag=${adapter.flagEnabled}; configValid=${adapter.configValid}.`,
      data: {
        adapter,
        runtime,
        priceMappingsConfigured,
        priceMappingsTotal: priceValues.length,
        webhookIngress,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "Billing diagnostics unavailable.",
      data: null,
      error: err instanceof Error ? err.message : "billing_error",
    };
  }
}

function probeAi(): ProbeOutcome<AiProbeData> {
  try {
    const serverConfig = getServerConfig();
    const visionProviders = getConfiguredVisionProviders();
    return {
      connected: true,
      summary: `OpenAI=${isOpenAIConfigured()}; vision providers=[${visionProviders.join(", ") || "none"}].`,
      data: {
        openai: isOpenAIConfigured(),
        aiJob: isAiJobConfigured(),
        visionProviders,
        gemini: isGeminiConfigured(),
        copilotModel: serverConfig.OPENAI_COPILOT_MODEL,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "AI configuration probe failed.",
      data: null,
      error: err instanceof Error ? err.message : "ai_error",
    };
  }
}

async function probeCloudflare(): Promise<ProbeOutcome<CloudflareProbeData>> {
  const appUrl = getPublicConfig().NEXT_PUBLIC_APP_URL || null;
  const runtimeHint =
    (process.env.CF_PAGES ?? "").trim() ||
    (process.env.CLOUDFLARE_DEPLOYMENT_ID ?? "").trim() ||
    (appUrl?.includes("aistroyka.ai") ? "opennext_cloudflare_worker" : null);

  if (!appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    return {
      connected: Boolean(runtimeHint),
      summary: runtimeHint
        ? `Local/dev runtime; Cloudflare hint=${runtimeHint}.`
        : "No public deployment URL — external edge probe skipped.",
      data: {
        appUrl,
        externalHealthOk: null,
        externalBuildSha7: null,
        runtimeHint,
      },
      error: null,
    };
  }

  try {
    const healthUrl = `${appUrl.replace(/\/+$/, "")}/api/v1/health`;
    const res = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      buildStamp?: { sha7?: string };
    };
    return {
      connected: true,
      summary: `External health ${res.status}; ok=${String(json.ok)}; edge URL reachable.`,
      data: {
        appUrl,
        externalHealthOk: res.ok && json.ok === true,
        externalBuildSha7: json.buildStamp?.sha7 ?? null,
        runtimeHint,
      },
      error: null,
    };
  } catch (err) {
    return {
      connected: false,
      summary: "External deployment health probe failed.",
      data: { appUrl, externalHealthOk: false, externalBuildSha7: null, runtimeHint },
      error: err instanceof Error ? err.message : "cloudflare_probe_error",
    };
  }
}

function probeMobile(): ProbeOutcome<MobileProbeData> {
  const data: MobileProbeData = {
    iosWorkerUrl: process.env.APP_STORE_WORKER_URL?.trim() || null,
    iosManagerUrl: process.env.APP_STORE_MANAGER_URL?.trim() || null,
    androidWorkerUrl: process.env.GOOGLE_PLAY_WORKER_URL?.trim() || null,
    androidManagerUrl: process.env.GOOGLE_PLAY_MANAGER_URL?.trim() || null,
    androidVersionCode: process.env.AISTROYKA_ANDROID_VERSION_CODE?.trim() || null,
    iosBuildNumber: process.env.AISTROYKA_IOS_BUILD_NUMBER?.trim() || null,
  };
  const configured = Object.values(data).some(Boolean);
  return {
    connected: configured,
    summary: configured
      ? "Mobile store URLs or build numbers present in environment."
      : "No mobile distribution metadata in environment.",
    data,
    error: configured ? null : "mobile_metadata_missing",
  };
}

export async function runLiveProbes(): Promise<LiveProbeBundle> {
  const checkedAt = new Date().toISOString();
  const [
    health,
    systemHealth,
    storage,
    featureFlags,
    migrations,
    platformAudit,
    cloudflare,
  ] = await Promise.all([
    probeHealth(),
    probeSystemHealth(),
    probeStorage(),
    probeFeatureFlags(),
    probeMigrations(),
    probePlatformAudit(),
    probeCloudflare(),
  ]);

  return {
    checkedAt,
    health,
    systemHealth,
    releaseEnv: probeReleaseEnv(),
    gitMetadata: probeGitMetadata(),
    storage,
    featureFlags,
    migrations,
    platformAudit,
    billing: probeBilling(),
    ai: probeAi(),
    cloudflare,
    mobile: probeMobile(),
  };
}

export function buildDataCoverage(probes: LiveProbeBundle): {
  sources: LiveDataSource[];
  coveragePercent: number;
} {
  const sources: LiveDataSource[] = LIVE_SOURCE_CATALOG.map((catalogItem) => {
    let connected = false;
    let summary = "Unavailable";
    const sourceId = catalogItem.id;

    switch (sourceId) {
      case "core_health":
        connected = probes.health.connected;
        summary = probes.health.summary;
        break;
      case "system_health":
        connected = probes.systemHealth.connected;
        summary = probes.systemHealth.summary;
        break;
      case "release_env":
        connected = probes.releaseEnv.connected;
        summary = probes.releaseEnv.summary;
        break;
      case "git_metadata":
        connected =
          probes.gitMetadata.connected &&
          Boolean(probes.gitMetadata.data?.sha || probes.gitMetadata.data?.buildTime);
        summary = probes.gitMetadata.summary;
        break;
      case "supabase_db":
        connected = probes.health.connected && probes.health.data?.db === "ok";
        summary = probes.health.connected
          ? `Database probe: ${probes.health.data?.db ?? "unknown"}.`
          : "Database probe unavailable.";
        break;
      case "supabase_storage":
        connected = probes.storage.connected;
        summary = probes.storage.summary;
        break;
      case "feature_flags_db":
        connected = probes.featureFlags.connected;
        summary = probes.featureFlags.summary;
        break;
      case "db_migrations":
        connected = probes.migrations.connected;
        summary = probes.migrations.summary;
        break;
      case "platform_audit_log":
        connected = probes.platformAudit.connected;
        summary = probes.platformAudit.summary;
        break;
      case "billing_diagnostics":
        connected = probes.billing.connected;
        summary = probes.billing.summary;
        break;
      case "ai_configuration":
        connected = probes.ai.connected;
        summary = probes.ai.summary;
        break;
      case "cloudflare_deploy":
        connected = probes.cloudflare.connected;
        summary = probes.cloudflare.summary;
        break;
      case "mobile_metadata":
        connected = probes.mobile.connected;
        summary = probes.mobile.summary;
        break;
      case "github_actions_env":
        connected = Boolean(
          probes.gitMetadata.data?.githubRunId ||
            probes.gitMetadata.data?.githubWorkflow ||
            probes.gitMetadata.data?.githubRepository
        );
        summary = connected
          ? `GitHub run=${probes.gitMetadata.data?.githubRunId ?? "n/a"}; workflow=${probes.gitMetadata.data?.githubWorkflow ?? "n/a"}.`
          : "GitHub Actions metadata not present in runtime environment.";
        break;
      case "notification_config":
        connected = probes.releaseEnv.connected;
        summary = probes.releaseEnv.connected
          ? `Push configured=${String(probes.releaseEnv.data?.pushConfigured)}.`
          : "Notification configuration probe unavailable.";
        break;
      default: {
        const _exhaustive: never = sourceId;
        summary = String(_exhaustive);
      }
    }

    const status: LiveSourceStatus = connected ? "connected" : "unavailable";
    return {
      id: catalogItem.id,
      label: catalogItem.label,
      category: catalogItem.category,
      status,
      summary,
      checkedAt: probes.checkedAt,
    };
  });

  const connectedCount = sources.filter((s) => s.status === "connected").length;
  const coveragePercent = Math.round((connectedCount / sources.length) * 100);
  return { sources, coveragePercent };
}
