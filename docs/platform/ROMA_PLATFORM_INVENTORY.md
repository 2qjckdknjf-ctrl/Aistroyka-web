# ROMA Platform Inventory

**Program:** ROMA Platform Integration  
**Status:** Phase 1 — complete (analysis only)  
**Branch:** `security/platform-admin-separation`  
**Date:** 2026-07-07  
**Scope:** Production subsystems observable from repo + live ROMA probes. **No health fabrication.**

Related docs: [ROMA_PLATFORM_MODEL.md](./ROMA_PLATFORM_MODEL.md) · [ROMA_PLATFORM_GAP_ANALYSIS.md](./ROMA_PLATFORM_GAP_ANALYSIS.md) · [ROMA_PLATFORM_INTEGRATION_ROADMAP.md](./ROMA_PLATFORM_INTEGRATION_ROADMAP.md)

---

## Executive Summary

AISTROYKA is a monorepo with **Cloudflare Workers** web runtime (`apps/web`), **Supabase** data plane (project **AISTROYKA**, `vthfrxehrursfloevnlp`), **iOS Manager/Worker** apps, **Android Manager/Worker** scaffolds, and a **platform-owner** admin surface at `admin.aistroyka.ai` / `/platform-admin`.

ROMA Operations Center (`/platform-admin/testing`) already integrates **15 live probe sources** via `roma-live-probes.ts`. This inventory maps **every production subsystem** to owner, health source, probes, APIs, services, and dependencies.

**Subsystem count:** **22** (see table below).

---

## Inventory Method

| Source | Used for |
|--------|----------|
| `apps/web/lib/platform-admin/roma-live-probes.ts` | Current ROMA probes + `LIVE_SOURCE_CATALOG` |
| `apps/web/lib/platform-admin/roma-quality-dashboard.service.ts` | Dashboard component mapping |
| `apps/web/app/api/v1/platform/**` | Platform-owner APIs |
| `apps/web/app/api/v1/owner/**` | Legacy owner APIs (Phase 1 alias) |
| `apps/web/lib/system/health.service.ts` | Subsystem health checks |
| `ios/`, `android/` | Mobile applications |
| `docs/security/`, `docs/release-hardening/` | Security + mobile reality |

**Rule:** If no automated evidence exists, status is **UNKNOWN** — never inferred healthy.

---

## Subsystem Inventory

### Legend

| Column | Meaning |
|--------|---------|
| **Health source** | Where ROMA should read state (today or planned) |
| **Current probe** | Implemented in `runLiveProbes()` or derived in dashboard |
| **Missing probe** | Gap for platform integration |
| **Owner** | Engineering ownership contour |

---

### 1. Web — Public Site

| Field | Value |
|-------|-------|
| **ID** | `web-public` |
| **Owner** | Web platform |
| **Health source** | `GET /api/v1/health` via `getHealthResponse()` |
| **Current probe** | `probeHealth()` → dashboard `website` component |
| **Missing probe** | Locale matrix, CWV/Lighthouse, marketing route inventory |
| **APIs** | `/api/v1/health`, public `(public)` routes |
| **Services** | `lib/controllers/health.ts`, middleware, `lib/security-headers.ts` |
| **Dependencies** | Cloudflare Workers, Next.js/OpenNext, Supabase anon |
| **ROMA status** | **Partial** — reachability only, not UX/perf |

---

### 2. Web — Dashboard (Contractor Ops)

| Field | Value |
|-------|-------|
| **ID** | `web-dashboard` |
| **Owner** | Web platform |
| **Health source** | Supabase reachability + auth prerequisites |
| **Current probe** | Derived: `web_dashboard` component (DB + env inference) |
| **Missing probe** | Playwright pilot smoke signal, role-flow health, onboarding completion rate |
| **APIs** | `/api/v1/dashboard/*`, `/api/v1/projects/*`, tenant-scoped v1 |
| **Services** | App Router `(dashboard)`, tenant RBAC, next-intl |
| **Dependencies** | Supabase Auth, tenant_members RLS, entitlements |
| **ROMA status** | **Partial** — infra proxy only |

---

### 3. Web — Platform Admin Shell

| Field | Value |
|-------|-------|
| **ID** | `web-platform-admin` |
| **Owner** | Platform engineering |
| **Health source** | `platform_owner_grants` + middleware gates |
| **Current probe** | Indirect via release-env + audit log; no dedicated shell probe |
| **Missing probe** | Shell route smoke, nav completeness, owner session freshness |
| **APIs** | `/api/v1/platform/*` (25 routes) |
| **Services** | `lib/platform-owner/*`, `lib/platform-admin/*`, `(platform-admin)` layout |
| **Dependencies** | Cloudflare Access, Supabase session, owner grants |
| **Pages** | Overview, Billing pilot, Leads, ROMA testing |
| **ROMA status** | **Partial** — ROMA is one tab; not unified EOC yet |

---

### 4. Backend — API Runtime

| Field | Value |
|-------|-------|
| **ID** | `backend-api` |
| **Owner** | Backend platform |
| **Health source** | `GET /api/v1/health` |
| **Current probe** | `probeHealth()`, `backend_api` component |
| **Missing probe** | p95 latency, error rate, route contract drift, lite-client allow-list audit |
| **APIs** | ~350 routes under `/api/v1/*` |
| **Services** | App Router API routes, Edge middleware, `lite-allow-list.ts` |
| **Dependencies** | Cloudflare Worker, Supabase service role (server routes) |
| **ROMA status** | **Partial** — liveness only |

---

### 5. Backend — System Health Service

| Field | Value |
|-------|-------|
| **ID** | `backend-system-health` |
| **Owner** | Backend platform |
| **Health source** | `getSystemHealth()` |
| **Current probe** | `probeSystemHealth()` |
| **Missing probe** | Workflows/events are stub-OK; no deep queue/job probes |
| **Services** | `database`, `ai_brain`, `copilot`, `workflows`, `events`, `alerts` |
| **Dependencies** | Supabase, OpenAI config |
| **ROMA status** | **Partial** — coarse service map |

---

### 6. Supabase — Database

| Field | Value |
|-------|-------|
| **ID** | `supabase-database` |
| **Owner** | Data platform |
| **Health source** | Health API DB check + migration inventory |
| **Current probe** | `probeHealth()` (db), `probeMigrations()` |
| **Missing probe** | RLS drift detector, migration parity repo↔remote, connection pool metrics |
| **APIs** | Supabase PostgREST (via client), admin service role |
| **Services** | `getAdminClient()`, migrations under `apps/web/supabase/migrations/` |
| **Dependencies** | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Production project** | AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1) |
| **ROMA status** | **Partial** |

---

### 7. Supabase — Auth

| Field | Value |
|-------|-------|
| **ID** | `supabase-auth` |
| **Owner** | Identity platform |
| **Health source** | Env + health flags (`supabaseReachable`, `serviceRoleConfigured`) |
| **Current probe** | Derived `authentication` component |
| **Missing probe** | Provider matrix (Apple/Telegram/email), HIBP status, session policy |
| **APIs** | `/api/v1/auth/*`, Supabase Auth |
| **Services** | Supabase SSR, login/register flows |
| **Dependencies** | Supabase Auth providers, middleware |
| **ROMA status** | **Partial** — config proxy |

---

### 8. Supabase — Storage

| Field | Value |
|-------|-------|
| **ID** | `supabase-storage` |
| **Owner** | Data platform |
| **Health source** | `admin.storage.listBuckets()` |
| **Current probe** | `probeStorage()` — `media` bucket presence |
| **Missing probe** | Upload session success rate, bucket policy audit, size quotas |
| **APIs** | `/api/v1/media/upload-sessions/*`, `/api/v1/projects/*/upload` |
| **Services** | Supabase Storage, upload finalize flows |
| **Dependencies** | Service role, RLS on storage objects |
| **ROMA status** | **Partial** |

---

### 9. Cloudflare — Edge & Deploy

| Field | Value |
|-------|-------|
| **ID** | `cloudflare-edge` |
| **Owner** | Release engineering |
| **Health source** | External `GET {APP_URL}/api/v1/health` + runtime env hints |
| **Current probe** | `probeCloudflare()` |
| **Missing probe** | Workers Builds API, wrangler deploy status, DNS/route inventory, Access policy snapshot |
| **APIs** | N/A in-app (deploy via GitHub Actions + Wrangler) |
| **Services** | `apps/web/wrangler.toml`, OpenNext, middleware bypass patches |
| **Dependencies** | Cloudflare account, GitHub deploy workflows |
| **Domains** | `aistroyka.ai`, `staging.aistroyka.ai`, `admin.aistroyka.ai` |
| **ROMA status** | **Partial** — external health fetch only |

---

### 10. Cloudflare — Access (Admin Perimeter)

| Field | Value |
|-------|-------|
| **ID** | `cloudflare-access` |
| **Owner** | Security / platform |
| **Health source** | **Manual** — documented in `PLATFORM_ADMIN_OWNER_ONLY_ACCESS_REPORT.md` |
| **Current probe** | **None** (no CF Access API token probe in ROMA) |
| **Missing probe** | Read-only Access app/policy audit (scheduled, owner-approved) |
| **Dependencies** | `admin.aistroyka.ai` Access app |
| **ROMA status** | **UNKNOWN** in dashboard — manual docs only |

---

### 11. AI — Provider & Copilot

| Field | Value |
|-------|-------|
| **ID** | `ai-runtime` |
| **Owner** | AI platform |
| **Health source** | Server config + `getSystemHealth().copilot/ai_brain` |
| **Current probe** | `probeAi()`, `probeSystemHealth()` |
| **Missing probe** | Live LLM gate (`ai_live_provider.sh`), fallback reason telemetry, cost/limit |
| **APIs** | `/api/v1/ai/*`, `/api/v1/projects/*/copilot/*` |
| **Services** | OpenAI, vision providers, copilot SSE |
| **Dependencies** | `OPENAI_API_KEY`, optional Gemini, AI job URL |
| **ROMA status** | **Partial** — configuration only, not live inference |

---

### 12. Notifications — Push & Messaging

| Field | Value |
|-------|-------|
| **ID** | `notifications` |
| **Owner** | Mobile + platform |
| **Health source** | `validateReleaseEnv().pushConfigured` + Telegram env |
| **Current probe** | `notification_config` catalog entry; `notifications` component |
| **Missing probe** | FCM/APNS send test, push_outbox depth, delivery success rate |
| **APIs** | `/api/v1/devices/*`, `/api/v1/notifications/*`, push processor |
| **Services** | `lib/platform/push/*`, FCM v1, APNS stub |
| **Dependencies** | FCM_*, APNS_* env, device_tokens table |
| **ROMA status** | **Partial** — env flags only |

---

### 13. Billing — Stripe & Entitlements

| Field | Value |
|-------|-------|
| **ID** | `billing` |
| **Owner** | Platform / finance ops |
| **Health source** | Billing adapter registry + provider config |
| **Current probe** | `probeBilling()` |
| **Missing probe** | Webhook ingress live test, entitlement drift shadow metrics in ROMA |
| **APIs** | `/api/v1/platform/billing/*`, Stripe webhooks, `/api/v1/billing/*` |
| **Services** | `billing-adapter-registry`, `stripe-price-mapping`, account layer (staged) |
| **Dependencies** | Stripe keys, sandbox vs live flags |
| **ROMA status** | **Partial** — diagnostics only |

---

### 14. iOS — Manager App

| Field | Value |
|-------|-------|
| **ID** | `ios-manager` |
| **Owner** | Mobile (iOS primary) |
| **Health source** | **UNKNOWN** at runtime — env store URLs / build number only |
| **Current probe** | `probeMobile()` — `APP_STORE_MANAGER_URL`, `AISTROYKA_IOS_BUILD_NUMBER` |
| **Missing probe** | TestFlight status, UITest smoke result, ASC upload evidence |
| **APIs** | Full `/api/v1` (not lite-restricted) |
| **Services** | `ios/AiStroykaManager`, Shared package |
| **Bundle** | `ai.aistroyka.manager` |
| **ROMA status** | **UNKNOWN** without store/CI signal |

---

### 15. iOS — Worker App

| Field | Value |
|-------|-------|
| **ID** | `ios-worker` |
| **Owner** | Mobile (iOS primary) |
| **Health source** | **UNKNOWN** at runtime |
| **Current probe** | `probeMobile()` — `APP_STORE_WORKER_URL`, build number |
| **Missing probe** | Device smoke, sync conflict rate, push registration health |
| **APIs** | Lite profile `ios_lite` allow-list paths |
| **Services** | `ios/AiStroykaWorker`, Shared, offline queue |
| **Bundle** | `ai.aistroyka.worker` |
| **ROMA status** | **UNKNOWN** without device/CI signal |

---

### 16. Android — Manager App

| Field | Value |
|-------|-------|
| **ID** | `android-manager` |
| **Owner** | Mobile (deferred parity) |
| **Health source** | **UNKNOWN** |
| **Current probe** | `probeMobile()` — Play URLs, `AISTROYKA_ANDROID_VERSION_CODE` |
| **Missing probe** | Play Console status, instrumented smoke, AAB signing gate |
| **APIs** | Full v1 (scaffold stage) |
| **Services** | `android/AiStroykaManager` Compose scaffold |
| **ROMA status** | **UNKNOWN** |

---

### 17. Android — Worker App

| Field | Value |
|-------|-------|
| **ID** | `android-worker` |
| **Owner** | Mobile (deferred parity) |
| **Health source** | **UNKNOWN** |
| **Current probe** | Same mobile env probe |
| **Missing probe** | FCM registration smoke, Play upload evidence |
| **APIs** | Lite profile `android_lite` |
| **Services** | `android/AiStroykaWorker`, FCM service |
| **ROMA status** | **UNKNOWN** |

---

### 18. Release Pipeline

| Field | Value |
|-------|-------|
| **ID** | `release-pipeline` |
| **Owner** | Release engineering |
| **Health source** | Git/build stamp + GitHub Actions env + external health SHA |
| **Current probe** | `probeGitMetadata()`, `probeReleaseEnv()`, `probeCloudflare()` |
| **Missing probe** | GitHub Actions run API, staging→prod promotion gate, deploy workflow status |
| **APIs** | N/A (CI/CD external) |
| **Services** | `.github/workflows/deploy-cloudflare-*.yml`, `cf:build` |
| **Dependencies** | GitHub, Cloudflare creds |
| **ROMA status** | **Partial** |

---

### 19. Security — Platform Perimeter

| Field | Value |
|-------|-------|
| **ID** | `security-platform` |
| **Owner** | Security engineering |
| **Health source** | `validateReleaseEnv()`, audit log, middleware tests |
| **Current probe** | `probeReleaseEnv()`, `probePlatformAudit()`, security domain section |
| **Missing probe** | RBAC matrix automation, header smoke in ROMA, break-glass grant inventory |
| **APIs** | `requirePlatformOwnerApi` on `/api/v1/platform/*` |
| **Services** | `gateOwnerRequest`, `platform_owner_grants`, RLS |
| **Dependencies** | CF Access, Supabase grants |
| **ROMA status** | **Partial** |

---

### 20. Security — Tenant Isolation

| Field | Value |
|-------|-------|
| **ID** | `security-tenant-isolation` |
| **Owner** | Security + backend |
| **Health source** | Code/tests — **no live ROMA probe** |
| **Current probe** | **None** |
| **Missing probe** | Tenant boundary smoke, customer-finance leakage checks |
| **Services** | RLS policies, account layer (staged), stakeholder portal gates |
| **ROMA status** | **UNKNOWN** in operations dashboard |

---

### 21. Integrations — Telegram & Webhooks

| Field | Value |
|-------|-------|
| **ID** | `integrations-external` |
| **Owner** | Integrations |
| **Health source** | Env presence (Telegram bot, Stripe webhook config) |
| **Current probe** | Partial via release-env + billing webhook diagnostics |
| **Missing probe** | Telegram webhook reachability, integration error backlog |
| **APIs** | `/api/v1/integrations/telegram/*`, `/api/v1/webhooks/*` |
| **ROMA status** | **Partial** — config only |

---

### 22. Platform Operations — Support & Tenants

| Field | Value |
|-------|-------|
| **ID** | `platform-operations` |
| **Owner** | Platform owner / support |
| **Health source** | Platform APIs (not in ROMA dashboard today) |
| **Current probe** | **None in ROMA** |
| **Missing probe** | Wire `GET /api/v1/platform/overview` into executive view |
| **APIs** | `/api/v1/platform/overview`, `/tenants`, `/support/tickets`, `/leads` |
| **Services** | Owner console data aggregations |
| **Dependencies** | Service role, owner grant |
| **ROMA status** | **Not integrated** — separate shell pages |

---

## ROMA Live Source Catalog (Current)

From `LIVE_SOURCE_CATALOG` (15 entries):

| ID | Category | Maps to subsystems |
|----|----------|-------------------|
| `core_health` | Platform Health | Web public, Backend API |
| `system_health` | Infrastructure | Backend system health |
| `release_env` | Security | Release pipeline, Security |
| `git_metadata` | Deployments | Release pipeline |
| `supabase_db` | Infrastructure | Supabase DB |
| `supabase_storage` | Infrastructure | Storage |
| `feature_flags_db` | Release | Platform config |
| `db_migrations` | Infrastructure | Supabase DB |
| `platform_audit_log` | Security | Platform perimeter |
| `billing_diagnostics` | Release | Billing |
| `ai_configuration` | AI | AI runtime |
| `cloudflare_deploy` | Deployments | Cloudflare edge |
| `mobile_metadata` | Mobile | iOS/Android (env only) |
| `github_actions_env` | Deployments | Release pipeline |
| `notification_config` | Infrastructure | Notifications |

---

## Platform Admin API Inventory (Owner-Gated)

| Route group | Purpose | ROMA integrated? |
|-------------|---------|------------------|
| `/platform/overview` | Tenant/user/support counts | **No** |
| `/platform/health` | Owner session check | **No** |
| `/platform/diagnostics` | User/invite lookup | **No** |
| `/platform/tenants/*` | Tenant metadata | **No** |
| `/platform/billing/*` | Billing pilot ops | **Partial** (probe only) |
| `/platform/leads/*` | Contact leads | **No** |
| `/platform/support/tickets/*` | Support queue | **No** |
| `/platform/testing/*` | ROMA quality + safe audit | **Yes** |
| `/platform/audit` | Owner audit log write | **Partial** (read probe) |

Legacy alias: `/api/v1/owner/*` (10 routes) — deprecation path documented in platform-admin separation work.

---

## Existing ROMA Module Integrations

| ROMA module | Primary data source | Subsystems covered |
|-------------|--------------------|--------------------|
| Executive Dashboard | `buildRomaQualityDashboard()` | 10 health cards, release, intelligence |
| Safe Audit | `runLiveProbes()` single pass | Cross-cutting snapshot |
| Audit History | `roma_audit_runs` table | Safe audit persistence |
| Engineering Intelligence | Derived from dashboard | Release, AI, security signals |
| Quality Graph | Static graph + change input | Product areas (not infra inventory) |
| Test Catalog | Static catalog | Planned tests (not live health) |
| Change Intelligence | Graph + catalog rules | Change risk (not live health) |
| Execution Planner/Engine | Policy only | No runtime health |

---

## Summary Counts

| Metric | Count |
|--------|-------|
| **Production subsystems inventoried** | **22** |
| **ROMA live probe sources** | **15** |
| **Partially observed in ROMA** | **14** |
| **UNKNOWN in ROMA** | **6** (CF Access, tenant isolation, 4 mobile apps without CI/store signal) |
| **Not integrated (platform shell APIs)** | **5** route groups |
| **Platform-owner API routes** | **25** under `/api/v1/platform/*` |

---

## Verdict

| Flag | Value |
|------|-------|
| **PLATFORM_INVENTORY_COMPLETE** | **YES** |
| **Evidence-based** | **YES** — gaps explicitly marked UNKNOWN |
| **Next step** | [ROMA_PLATFORM_MODEL.md](./ROMA_PLATFORM_MODEL.md) |
