# B2.2 — Env governance audit — AISTROYKA

**Date:** 2026-03-18  
**Scope:** `apps/web` env access only. No mobile, no API path migration.

---

## A. Current env access map (product paths only)

_Tests and audit/archive trees are excluded unless noted; focus is runtime/build/deploy paths._

### 1. Declared config layer

- `lib/config/public.ts` — **build/client-safe** NEXT_PUBLIC env (Supabase URL/anon key, app URL, build stamp, app env).  
- `lib/config/server.ts` — **server-only** env (OPENAI, AI job, SUPABASE_SERVICE_ROLE_KEY, timeouts).  
- `lib/config/release-env.ts`, `lib/config/env.ts`, `lib/config/debug.ts`, `lib/config/diag.ts` — **release validation and debug flags.**  
- `lib/config/index.ts` — header documents **canonical declaration + allowed exceptions** (see file).

These modules are the canonical env contract and validation entrypoints.

### 2. Direct `process.env` reads (selected, non-test, non-audit)

- **Routing / middleware / layout / shell**  
  - `app/middleware.ts`: `process.env.NODE_ENV` for HSTS/security headers and redirects.  
  - `app/layout.tsx`: `process.env.NEXT_PUBLIC_APP_URL` (with default).  
  - `app/[locale]/(dashboard)/layout.tsx`: `process.env.NODE_ENV` to gate debug banners/UI.  
  - `app/error.tsx`: checks `process.env.NODE_ENV` for error UX.  
  - `components/BuildStamp.tsx`, `components/DashboardShell.tsx`: NEXT_PUBLIC build/env vars for surfacing build info.

- **Supabase / auth / system**  
  - `lib/supabase/middleware.ts`:  
    - Validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
    - Uses `process.env.NODE_ENV` / `process.env.VERCEL_ENV` to decide cookie settings and dev vs preview behavior.  
  - `lib/auth/admin.ts`: reads admin email list from `process.env[ADMIN_EMAILS_KEY]`.  
  - `lib/system/system-route-auth.ts`: `NODE_ENV`, `NEXT_PUBLIC_APP_ENV`, `SYSTEM_API_KEY` gating system routes.  
  - `app/api/auth/login/route.ts`: uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` directly to build client.

- **Jobs / metrics / ops**  
  - `lib/api/cron-auth.ts`: `REQUIRE_CRON_SECRET`, `CRON_SECRET` for cron protection.  
  - `lib/ops/ops-metrics.repository.ts`: `UPLOAD_STUCK_HOURS`, `DEVICE_OFFLINE_HOURS`.  
  - `lib/sync/change-log.repository.ts`: `SYNC_MIN_RETAINED_CURSOR`.  
  - `lib/domain/upload-session/upload-session.service.ts`: `MEDIA_FINALIZE_VERIFY_OBJECT`, `MEDIA_FINALIZE_VERIFY_STRICT`.  
  - `lib/controllers/health.ts`: uses `NEXT_PUBLIC_APP_ENV` for health payload.

- **AI / billing / push / exports**  
  - `lib/platform/ai/providers/provider.anthropic.ts`: `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL`.  
  - `lib/platform/ai/providers/provider.gemini.ts`: `GOOGLE_AI_API_KEY`, `GEMINI_API_KEY`, `GEMINI_VISION_MODEL`.  
  - `lib/platform/ai/ai.service.ts`: early return when `NODE_ENV === "test"`.  
  - `lib/services/aiSignature.ts`: dev-only logging when `NODE_ENV === "development"`.  
  - `lib/platform/billing/stripe.client.ts`: `STRIPE_SECRET_KEY`.  
  - `lib/platform/billing/billing.service.ts`: fallback `STRIPE_PRICE_ID`.  
  - `lib/platform/billing/webhooks.handler.ts`: `STRIPE_WEBHOOK_SECRET`.  
  - `lib/platform/push/fcm.provider.ts` / `fcm.stub.ts` / `providers/google-oauth.ts`: `FCM_*`, `GOOGLE_APPLICATION_CREDENTIALS`.  
  - `lib/platform/push/apns.provider.ts` / `apns.stub.ts`: `APNS_ENV`, `APNS_KEY|APNS_PRIVATE_KEY`, `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_BUNDLE_ID`.  
  - `lib/platform/identity/scim.stub.ts`: `SCIM_ENABLED`, `SCIM_TOKEN`.  
  - `lib/platform/exports/sinks/sink.*_stub.ts`: `SNOWFLAKE_ACCOUNT`, `BIGQUERY_DATASET`, `AWS_S3_EXPORT_BUCKET`.

- **Core config already using funnel**  
  - `lib/config/public.ts` / `server.ts` / `release-env.ts` / `env.ts` / `debug.ts` / `diag.ts` — all **internal** to `lib/config`, reading `process.env` as expected.

---

## B. Drift classification

### 1. Safe direct access (acceptable outside `lib/config` for now)

- **Debug-only or environment/UX toggles:**  
  - `NODE_ENV` checks in layouts, error boundary, logger, `aiSignature` — affect debug behavior/logging only.  
  - `NEXT_PUBLIC_BUILD_*` reads in `BuildStamp` and `DashboardShell` — purely informational.
- **System-level glue extremely close to infra:**  
  - `middleware.ts` security headers based on `NODE_ENV`.  
  - `supabase/middleware.ts` one-off validation for core Supabase env + dev/preview branching.

These do not materially benefit from being wrapped again by `lib/config`; moving them now would be churn with little safety gain.

### 2. Questionable direct access (should be centralized over time)

- **Auth / admin / system keys:**  
  - `ADMIN_EMAILS_KEY` in `lib/auth/admin.ts`.  
  - `SYSTEM_API_KEY` in `lib/system/system-route-auth.ts`.  
  - `WEBHOOK_INCOMING_SECRET` in `app/api/webhooks/incoming/route.ts`.
- **Domain/platform feature flags:**  
  - Upload-session verification flags in `lib/domain/upload-session/upload-session.service.ts`.  
  - Retention/ops thresholds in `ops-metrics.repository.ts` and `sync/change-log.repository.ts`.

These are effectively **business config knobs** and could be described centrally in `lib/config/server` or a `lib/config/platform` module.

### 3. Should be centralized (part of env “contract”) but already partially are

- **AI, billing, push, cron, service-role keys:**  
  - Many of these are already modeled in `lib/config/server.ts` and `lib/config/release-env.ts` (e.g. `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, AI timeouts, cron flags).  
  - Some platform modules still read raw `process.env` directly (`provider.anthropic.ts`, `provider.gemini.ts`, Stripe/APNS/FCM stubs).

These belong to the **canonical env contract** and over time should all be read via `getServerConfig()` or dedicated config helpers rather than ad-hoc `process.env` reads.

### 4. Should remain external/manual

- **Deployment/platform settings not expressible purely in code:**  
  - Cloudflare route configuration, Supabase backup/PITR, external scheduler URLs.  
  - These live in `wrangler*.toml`, dashboards, and docs, not in `process.env` usage; they are out of scope for centralization here.

---

## C. Recommended correction model (B2.2 outcome)

### Canonical rule (after this step)

- **Updated truth:**  
  - `lib/config` is the **canonical declaration** of the env contract (what vars exist, how they are validated and grouped).  
  - **Direct `process.env` reads outside `lib/config` are allowed _only_ for:**  
    - Debug/UI behavior (`NODE_ENV` checks, build stamp display).  
    - Very local infra glue (e.g. middleware security headers, Supabase bootstrap).  
    - Platform/provider boundaries that read raw secrets but are conceptually part of the “provider adapter” layer.
- **Aspirational direction:**  
  - New feature code that depends on env **should** go through `lib/config` (e.g. `getServerConfig`, dedicated helpers) rather than adding new `process.env` sites.

### Migration priorities (future work, not done here)

1. **High-value centralization:**  
   - Auth/admin/system keys (`SYSTEM_API_KEY`, `ADMIN_EMAILS_KEY`, `WEBHOOK_INCOMING_SECRET`).  
   - Domain/platform thresholds and flags (upload verification, retention windows) that affect behavior and safety.
2. **Provider adapters:**  
   - Normalize AI/billing/push env usage so they all read via `getServerConfig()` or a `getPlatformConfig()` helper, avoiding duplicated parsing/validation.
3. **Documentation alignment:**  
   - Keep `docs/ENVIRONMENT-VARIABLES.md` and `lib/config/release-env.ts` as the authoritative list of env names and categories.

### What is intentionally **not** touched now

- Widespread rewrites of existing `process.env` sites in platform/domain code.  
- Any behavior changes in middleware, auth, or providers — this step is governance and documentation, not refactor.

---

## D. Closure (B2.2)

- **`lib/config/index.ts` and `public.ts` comments** now match the governance model in §C (truthful rule + guidance for new code).  
- No runtime behavior or env read sites were moved; broad centralization remains future work.
