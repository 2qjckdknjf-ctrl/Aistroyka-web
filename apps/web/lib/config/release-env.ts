/**
 * Release / pilot environment validation.
 * Validates env var presence and safety (no secrets in output).
 * Use for startup checks and release-readiness scripts.
 */

export type EnvCategory =
  | "required_web"
  | "required_jobs"
  | "required_ai"
  | "required_billing"
  | "required_push"
  | "optional"
  | "debug_forbidden_in_prod";

export interface EnvVarSpec {
  name: string;
  category: EnvCategory;
  required: boolean;
  description: string;
  /** When true, in production this var must be unset or "false" */
  forbiddenInProd?: boolean;
}

const RELEASE_ENV_SPEC: EnvVarSpec[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", category: "required_web", required: true, description: "Supabase project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", category: "required_web", required: true, description: "Supabase anon key" },
  { name: "NEXT_PUBLIC_APP_URL", category: "required_web", required: true, description: "App URL for callbacks" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", category: "required_jobs", required: true, description: "Service role for jobs/admin" },
  { name: "REQUIRE_CRON_SECRET", category: "required_jobs", required: false, description: "Set to true in production" },
  { name: "CRON_SECRET", category: "required_jobs", required: false, description: "Required when REQUIRE_CRON_SECRET=true" },
  { name: "OPENAI_API_KEY", category: "required_ai", required: false, description: "At least one AI provider key" },
  { name: "ANTHROPIC_API_KEY", category: "required_ai", required: false, description: "Optional vision provider" },
  { name: "GOOGLE_AI_API_KEY", category: "required_ai", required: false, description: "Optional vision provider" },
  { name: "GEMINI_API_KEY", category: "required_ai", required: false, description: "Optional vision provider" },
  { name: "AI_ANALYSIS_URL", category: "required_ai", required: false, description: "In-app AI endpoint URL" },
  { name: "STRIPE_SECRET_KEY", category: "required_billing", required: false, description: "Stripe API key" },
  { name: "STRIPE_WEBHOOK_SECRET", category: "required_billing", required: false, description: "Webhook signature secret" },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", category: "required_billing", required: false, description: "Client Stripe key" },
  { name: "FCM_PROJECT_ID", category: "required_push", required: false, description: "FCM for Android push" },
  { name: "FCM_CLIENT_EMAIL", category: "required_push", required: false, description: "FCM service account" },
  { name: "FCM_PRIVATE_KEY", category: "required_push", required: false, description: "FCM PEM key" },
  { name: "APNS_KEY", category: "required_push", required: false, description: "APNS for iOS push" },
  { name: "APNS_KEY_ID", category: "required_push", required: false, description: "APNS key ID" },
  { name: "APNS_TEAM_ID", category: "required_push", required: false, description: "APNS team ID" },
  { name: "APNS_BUNDLE_ID", category: "required_push", required: false, description: "APNS bundle ID" },
  { name: "DEBUG_AUTH", category: "debug_forbidden_in_prod", required: false, description: "Must be unset or false in prod", forbiddenInProd: true },
  { name: "DEBUG_DIAG", category: "debug_forbidden_in_prod", required: false, description: "Must be unset or false in prod", forbiddenInProd: true },
  { name: "ENABLE_DIAG_ROUTES", category: "debug_forbidden_in_prod", required: false, description: "Must be unset or false in prod", forbiddenInProd: true },
  { name: "NODE_ENV", category: "required_web", required: true, description: "development | production" },
];

export interface EnvValidationResult {
  name: string;
  category: EnvCategory;
  present: boolean;
  nonEmpty: boolean;
  safe: boolean;
  message: string;
}

export interface ReleaseEnvReport {
  isProduction: boolean;
  criticalMissing: string[];
  optionalMissing: string[];
  forbiddenInProdSet: string[];
  cronConfigured: boolean;
  aiConfigured: boolean;
  billingConfigured: boolean;
  pushConfigured: boolean;
  results: EnvValidationResult[];
  verdict: "PASS" | "PASS_WITH_WARNINGS" | "FAIL";
  verdictReason: string;
}

function getEnv(name: string): string {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function isProduction(): boolean {
  return (process.env.NODE_ENV ?? "").trim().toLowerCase() === "production";
}

export function validateReleaseEnv(): ReleaseEnvReport {
  const prod = isProduction();
  const results: EnvValidationResult[] = [];
  const criticalMissing: string[] = [];
  const optionalMissing: string[] = [];
  const forbiddenInProdSet: string[] = [];

  for (const spec of RELEASE_ENV_SPEC) {
    const value = getEnv(spec.name);
    const present = spec.name in process.env;
    const nonEmpty = value.length > 0;

    let safe = true;
    let message = present ? (nonEmpty ? "set" : "empty") : "missing";

    if (spec.required && !nonEmpty) {
      criticalMissing.push(spec.name);
      safe = false;
      message = "missing (required)";
    } else if (!spec.required && !nonEmpty && (spec.category === "required_web" || spec.category === "required_jobs")) {
      if (spec.name === "NODE_ENV" && !present) {
        criticalMissing.push(spec.name);
        message = "missing (required)";
        safe = false;
      }
    }

    if (spec.forbiddenInProd && prod && nonEmpty && (value === "true" || value.toLowerCase() === "true")) {
      forbiddenInProdSet.push(spec.name);
      safe = false;
      message = "must be unset or false in production";
    }

    if (!spec.required && !nonEmpty && ["required_ai", "required_billing", "required_push"].includes(spec.category)) {
      optionalMissing.push(spec.name);
    }

    results.push({
      name: spec.name,
      category: spec.category,
      present,
      nonEmpty,
      safe,
      message,
    });
  }

  // NODE_ENV required
  const nodeEnv = getEnv("NODE_ENV");
  if (!nodeEnv && !criticalMissing.includes("NODE_ENV")) {
    criticalMissing.push("NODE_ENV");
  }

  // Cron: when REQUIRE_CRON_SECRET=true, CRON_SECRET must be set
  const requireCron = process.env.REQUIRE_CRON_SECRET === "true";
  const cronSecret = getEnv("CRON_SECRET");
  const cronConfigured = !requireCron || (requireCron && cronSecret.length > 0);
  if (requireCron && !cronSecret) {
    criticalMissing.push("CRON_SECRET");
  }

  // At least one AI key for AI features (optional for minimal run)
  const aiConfigured =
    getEnv("OPENAI_API_KEY").length > 0 ||
    getEnv("ANTHROPIC_API_KEY").length > 0 ||
    getEnv("GOOGLE_AI_API_KEY").length > 0 ||
    getEnv("GEMINI_API_KEY").length > 0;

  const billingConfigured =
    getEnv("STRIPE_SECRET_KEY").length > 0 &&
    getEnv("STRIPE_WEBHOOK_SECRET").length > 0;

  const pushConfigured =
    (getEnv("FCM_PROJECT_ID").length > 0 && getEnv("FCM_CLIENT_EMAIL").length > 0 && getEnv("FCM_PRIVATE_KEY").length > 0) ||
    (getEnv("APNS_KEY").length > 0 && getEnv("APNS_KEY_ID").length > 0 && getEnv("APNS_TEAM_ID").length > 0 && getEnv("APNS_BUNDLE_ID").length > 0);

  let verdict: ReleaseEnvReport["verdict"] = "PASS";
  let verdictReason = "All critical env present; no forbidden flags in prod.";

  if (criticalMissing.length > 0) {
    verdict = "FAIL";
    verdictReason = `Missing critical: ${criticalMissing.join(", ")}`;
  } else if (forbiddenInProdSet.length > 0) {
    verdict = "FAIL";
    verdictReason = `Forbidden in production: ${forbiddenInProdSet.join(", ")}`;
  } else if (prod && !cronConfigured) {
    verdict = "FAIL";
    verdictReason = "Production requires REQUIRE_CRON_SECRET=true and CRON_SECRET set";
  } else if (optionalMissing.length > 0 || !aiConfigured) {
    verdict = "PASS_WITH_WARNINGS";
    verdictReason = optionalMissing.length > 0
      ? `Optional not set: ${optionalMissing.slice(0, 5).join(", ")}${optionalMissing.length > 5 ? "..." : ""}`
      : "AI or other optional features not configured";
  }

  return {
    isProduction: prod,
    criticalMissing,
    optionalMissing,
    forbiddenInProdSet,
    cronConfigured,
    aiConfigured,
    billingConfigured,
    pushConfigured,
    results,
    verdict,
    verdictReason,
  };
}
