# Phase 2 — SaaS Core Completion and Cleanup

**Project:** AISTROYKA.AI  
**Phase:** Security hardening, admin/billing completeness, API cleanup, repo hygiene, ops/runbooks.  
**Status:** Complete.

**Non-negotiables:** No v1 API contract breaks; preserve Phase 1 (AIService, SyncService, Lite allow-list, Lite idempotency); admin endpoints consistently protected; billing safe when Stripe not configured; legacy routes thin wrappers with deprecation headers; root /app must not affect build/deploy.

---

## Stage 0 — Baseline and canonical guard

### 0.1 Phase 1 report summary

- AIService: single vision entry (policy → router → usage).
- SyncService.bootstrap: thin sync route.
- Lite allow-list: ios_lite/android_lite restricted to allowed paths; 403 otherwise.
- Idempotency: lite writes require x-idempotency-key; replay returns cached response.

### 0.2 Current admin protection

- **Pattern:** All `/api/v1/admin/*` routes use `getTenantContextFromRequest` → `requireTenant(ctx)` → `authorize(ctx, "admin:read")` or `authorize(ctx, "admin:write")` from `@/lib/tenant` (tenant.policy).
- **Scopes:** `admin:read` and `admin:write` require role `admin` or `owner`; `billing:admin` requires `owner`; `jobs:process` requires `admin`.
- **Standard approach (Phase 2):** Introduce a single `requireAdmin(ctx, "read" | "write")` helper that calls `requireTenant` (caller) then `authorize(ctx, "admin:read" | "admin:write")` and returns 403 if false. Apply to every admin route for consistency.

### 0.3 Diag/debug routes

- `/api/_debug/auth` — gated by `isDebugAuthAllowed()` (DEBUG_AUTH + host allowlist in prod).
- `/api/diag/supabase` — gated by `isDebugDiagAllowed()` (DEBUG_DIAG + host allowlist in prod).
- `/api/health/auth` — **not gated**; returns `{ hasSupabaseEnv, authConfigured }`. To be gated behind ENABLE_DIAG_ROUTES or existing diag flag in Stage 1.

### 0.4 Billing routes

- `/api/v1/billing/checkout-session` — requireTenant + authorize(billing:admin); returns 503 "Service unavailable" when admin null.
- `/api/v1/billing/portal` — same pattern.
- `/api/v1/billing/webhook` — no tenant; uses raw body + Stripe-Signature; 503 "Unavailable" when admin null. Standardize 503 body to `{ error: "service_unavailable", code: "stripe_not_configured" }` in Stage 2.

### 0.5 Root /app

- Root `/app` exists with api/, (auth)/, (dashboard)/, smoke/. Build and deploy use **apps/web**; next.config.js lives in apps/web and does not reference root app. Confirmed: root app is not in build.

---

## Stage 1 — Admin security hardening (done)

- **requireAdmin(ctx, "read" | "write")** in `lib/api/require-admin.ts`; applied to all 18 admin routes. Each route still calls `requireTenant` then `requireAdmin`; 403 with "Insufficient rights" when not admin/owner.
- **Diag gate:** `lib/config/diag.ts` — `isDiagEnabled()` true when NODE_ENV !== production or ENABLE_DIAG_ROUTES=true. `/api/health/auth` returns 404 when diag disabled. `getDebugConfig()` in debug.ts also honors ENABLE_DIAG_ROUTES for debugAuth/debugDiag in production.
- **Tests:** require-admin.test.ts (owner/admin pass, member/viewer 403); diag.test.ts (production + ENABLE_DIAG_ROUTES); health/auth route test (404 when diag disabled).

---

## Stage 2 — Billing completeness (done)

- **503 when Stripe not configured:** `lib/platform/billing/billing-responses.ts` exports `BILLING_503_BODY` { error: "service_unavailable", code: "stripe_not_configured" }. Checkout-session and portal return it when `!admin || !isStripeConfigured()`. Webhook returns it when `!admin || !isWebhookConfigured()`.
- **Webhook:** Already used raw body (`request.text()`), Stripe-Signature verification, and 400 on invalid signature. No logic change; idempotency is inherent in upsert-by-tenant.
- **Tests:** billing-routes.test.ts (BILLING_503_BODY shape, verifyWebhookEvent returns null when signature missing).

---

## Stage 3 — Legacy route consolidation (done)

- **Legacy routes:** `/api/health` and `/api/ai/analyze-image` (and existing `/api/projects`, `/api/tenant/invite` with setLegacyApiHeaders). Added deprecation headers to **all** responses from `/api/ai/analyze-image` via `withLegacyHeaders()` using existing `setLegacyApiHeaders` (Deprecation: true, Sunset: 2026-06-01).
- **Helper:** Existing `lib/api/deprecation-headers.ts` (setLegacyApiHeaders, LEGACY_API_HEADERS). No new deprecation.ts; reused.
- **Tests:** analyze-image route test includes "includes Deprecation and Sunset headers (legacy route)".

---

## Stage 4 — Root /app resolution (done)

- **Proof:** next.config.js and app dir are under apps/web; root package.json only delegates to apps/web. No tsconfig or OpenNext config references root app.
- **Resolution:** Root `app` moved to **archive/legacy-app** with README stating it must not be used for build/deploy. Git recorded as rename.
- **Verification:** `npm run build` and `npm run cf:build` pass after move.

---

## Stage 5 — Cron / jobs process runbook (done)

- **Strategy:** Documented in docs/runbooks/JOBS_PROCESSING.md (Cloudflare Cron or external scheduler; schedule 1–5 min; env vars; manual curl; expected responses; troubleshooting).
- **Optional cron secret:** When `REQUIRE_CRON_SECRET=true`, `lib/api/cron-auth.ts` — `requireCronSecretIfEnabled(request)` returns 403 with code `cron_unauthorized` if `x-cron-secret` missing or does not match `CRON_SECRET`. Applied at top of POST /api/v1/jobs/process.
- **Tests:** jobs/process/route.test.ts — 403 and code cron_unauthorized when REQUIRE_CRON_SECRET true and header missing or wrong.

---

## Stage 6 — Final verification (done)

- **Commands run:** `npm install --legacy-peer-deps`, `npm test -- --run`, `npm run build`, `npm run cf:build`. All passed (212 tests, build and cf:build successful).
- **Optional:** `npm run e2e` with app running for Playwright smoke.

---

## Files touched

### New

- apps/web/lib/api/require-admin.ts, require-admin.test.ts
- apps/web/lib/config/diag.ts, diag.test.ts
- apps/web/lib/platform/billing/billing-responses.ts
- apps/web/lib/api/cron-auth.ts
- apps/web/app/api/health/auth/route.test.ts
- apps/web/app/api/v1/billing/billing-routes.test.ts
- apps/web/app/api/v1/jobs/process/route.test.ts
- docs/runbooks/JOBS_PROCESSING.md
- archive/legacy-app/README.md (and moved app → archive/legacy-app)

### Modified

- All 18 apps/web/app/api/v1/admin/**/route.ts (requireAdmin)
- apps/web/app/api/health/auth/route.ts (isDiagEnabled gate)
- apps/web/lib/config/debug.ts (ENABLE_DIAG_ROUTES in getDebugConfig)
- apps/web/lib/config/config.test.ts (ENABLE_DIAG_ROUTES test)
- apps/web/app/api/v1/billing/checkout-session/route.ts, portal/route.ts, webhook/route.ts (BILLING_503_BODY, isStripeConfigured/isWebhookConfigured)
- apps/web/app/api/ai/analyze-image/route.ts (withLegacyHeaders on all responses), route.test.ts (Deprecation header test)
- apps/web/app/api/v1/jobs/process/route.ts (requireCronSecretIfEnabled)
- Root: app/ removed (moved to archive/legacy-app)

---

## How to verify

```bash
cd apps/web
npm install --legacy-peer-deps
npm test -- --run
npm run build
npm run cf:build
```

Optional: `npm run e2e` with dev server running.

**Expected:** 212 tests pass; build and cf:build complete without errors. No references to root `app` in build.

---

## Behavior changes summary

| Area | Change |
| ------ | -------- |
| Admin | All /api/v1/admin/* use requireAdmin(ctx, "read"\|"write"); 403 "Insufficient rights" for non-admin. |
| Diag | /api/health/auth returns 404 in production unless ENABLE_DIAG_ROUTES=true. _debug and diag/supabase already gated; ENABLE_DIAG_ROUTES now enables them in prod. |
| Billing | When Stripe or admin not configured, all billing endpoints return 503 with { error: "service_unavailable", code: "stripe_not_configured" }. |
| Legacy | /api/ai/analyze-image responses include Deprecation: true and Sunset. |
| Jobs | When REQUIRE_CRON_SECRET=true, POST /api/v1/jobs/process requires x-cron-secret; otherwise 403 with code "cron_unauthorized". |
| Root app | Root /app moved to archive/legacy-app; build uses only apps/web. |

---

## Remaining gaps (Phase 3 / Phase 4)

- **Phase 3:** AI multi-provider tuning, construction brain alignment, further admin/billing feature completeness.
- **Phase 4:** Mobile push, offline/sync enhancements, additional runbooks.

---

## Security checklist

- [x] All admin routes require admin scope (requireAdmin)
- [x] Diag/debug gated in production (ENABLE_DIAG_ROUTES / isDiagEnabled)
- [x] Billing 503 when Stripe not configured (BILLING_503_BODY)
- [x] Webhook signature verified (unchanged; already in place)
- [x] Legacy routes deprecation headers only (no removal)
- [x] Root app isolated (moved to archive/legacy-app)
