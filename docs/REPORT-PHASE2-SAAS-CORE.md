# Phase 2 — SaaS Core Completion and Cleanup

**Project:** AISTROYKA.AI  
**Phase:** Security hardening, admin/billing completeness, API cleanup, repo hygiene, ops/runbooks.  
**Status:** In progress.

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

## Stage 1 — Admin security hardening (placeholder)

- _Inventory and requireAdmin application._
- _Diag gate: ENABLE_DIAG_ROUTES or isDiagEnabled()._
- _Tests: non-admin 403, admin 200; diag disabled => 404/403._

---

## Stage 2 — Billing completeness (placeholder)

- _Stripe-not-configured => 503 + stable JSON code._
- _Webhook: signature verification, raw body, idempotency._
- _Tests: 503 shape, webhook invalid sig, valid mock._

---

## Stage 3 — Legacy route consolidation (placeholder)

- _Legacy list: /api/health, /api/ai/analyze-image, /api/projects*, /api/tenant*._
- _deprecation.ts helper; wrappers with Deprecation header._
- _Tests: same shape + Deprecation header._

---

## Stage 4 — Root /app resolution (placeholder)

- _Proof: build entry apps/web/app._
- _Option A: move to legacy_app__do_not_use or archive._
- _Option B: delete only if proven unused._
- _Doc and verify build._

---

## Stage 5 — Cron / jobs process runbook (placeholder)

- _Strategy: Cloudflare Cron or external scheduler._
- _Optional REQUIRE_CRON_SECRET + x-cron-secret._
- _Runbook: docs/runbooks/JOBS_PROCESSING.md._
- _Test: cron secret when required._

---

## Stage 6 — Final verification and report (placeholder)

- _Commands: install, test, build, cf:build._
- _Fill all sections; remaining gaps Phase 3/4; security checklist._

---

## Files touched (to be filled)

- _Per stage._

---

## How to verify (to be filled)

- _Commands and expected results._

---

## Behavior changes summary (to be filled)

- _Admin/diag gating, billing 503, deprecation headers, cron secret._

---

## Remaining gaps (Phase 3 / Phase 4)

- _AI multi-provider, construction brain alignment._
- _Mobile push, offline._

---

## Security checklist (to be filled)

- [ ] All admin routes require admin scope
- [ ] Diag/debug gated in production
- [ ] Billing 503 when Stripe not configured
- [ ] Webhook signature verified
- [ ] Legacy routes deprecation headers only
- [ ] Root app isolated or removed
