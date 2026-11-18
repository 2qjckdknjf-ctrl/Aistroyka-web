# Platform Admin Phase 1 Post-Audit

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Auditor role:** Principal Security Reviewer + Platform Admin Auditor  
**Commits reviewed:** `962491db` (P0 lockdown), `ae86cb50` (Phase 1 migration)  
**Scope:** Read-only post-audit. No implementation changes.

---

## Executive summary

Phase 1 migration on `security/platform-admin-separation` successfully separates the **platform admin cabinet** from tenant company `/admin`. Canonical APIs live under `/api/v1/platform/*`; legacy `/api/v1/owner/*` and `/api/v1/admin/billing|leads/*` remain as **deprecated delegates**. P0 lockdown controls are intact. No security regressions were found in the audited surface.

Residual items are **hygiene and deploy-readiness** (dead legacy UI components, unused host-policy helper, `admin.aistroyka.ai` DNS/Worker routing not deployed)—not acceptance blockers for Phase 1.

---

## Audit checklist

| # | Check | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | `/platform-admin` isolated from tenant `/admin` | **PASS** | Separate App Router group `(platform-admin)`; not under `(dashboard)/admin` layout. Dedicated `PlatformAdminShell` with no tenant-admin nav links. Tenant `/admin` hub has no billing/leads links (P0 removal confirmed). |
| 2 | Tenant admins cannot access platform admin pages | **PASS** | Middleware `gateOwnerRequest` denies pages without `platform_owner_grants` (403, `no_session` / `no_grant`). Layout `assertPlatformOwnerPageAccess` is defense-in-depth. Legacy `/admin/billing-pilot` and `/admin/leads` layouts redirect tenant admins to `/admin` before page redirect. |
| 3 | Platform owners can access platform admin pages | **PASS** | Grant holders pass middleware + `assertPlatformOwnerPageAccess`. Pages render under `PlatformAdminShell`. Clients fetch `/api/v1/platform/*`. |
| 4 | `/api/v1/platform/*` is canonical | **PASS** | 21 route files under `app/api/v1/platform/` (owner console, billing, leads). All platform billing/leads handlers use `requirePlatformOwnerApi` only—no `requireTenant` / `requireAdmin` in platform namespace (grep clean). UI clients in `components/platform-admin/` call `/api/v1/platform/*` only. |
| 5 | `/api/v1/owner/*` aliases temporary and deprecated | **PASS** | All 10 owner routes are thin delegates via `delegateToPlatformApi` → `withLegacyOwnerApiDeprecation` sets `Deprecation: true` + `Link` successor header. |
| 6 | `/api/v1/admin/billing/*` and `/api/v1/admin/leads/*` no longer primary tenant-admin APIs | **PASS** | UI pages redirect to `/platform-admin/*`. Admin API routes delegate to platform with `Deprecation: true`. Canonical enforcement is `requirePlatformOwnerApi` on platform handlers. Tenant admins calling legacy admin URLs receive 403 at canonical handler (middleware does not gate admin namespace; handler-level gate is sufficient). |
| 7 | Middleware protects platform admin on Cloudflare Workers | **PASS** | `middleware.ts` gates `isPlatformAdminApiPath` (`/api/v1/owner` + `/api/v1/platform`) and `isPlatformAdminPagePath` (`/owner` + `/platform-admin`). `patch-worker-bypass-api-middleware.cjs` exempts both namespaces from API bypass so owner gate runs on Workers. `shouldBypassApiMiddleware` test confirms behavior. |
| 8 | Redirects do not create security bypass | **PASS** | Tenant admin → `/admin/leads` or `/admin/billing-pilot`: layout guard runs first → redirect to `/admin` (never reaches platform-admin redirect). Platform owner → legacy path → layout allows → page redirect → platform-admin layout re-validates grant. `/owner` → `/platform-admin`: middleware + owner layout guard before redirect. No open redirect or grant skip observed. |
| 9 | Navigation separation is clear | **PASS** | `PlatformAdminShell` header: “Platform admin cabinet” + “Isolated cross-tenant control layer · not tenant company admin”. Nav: Overview / Billing pilot / Contact leads only. Tenant `/admin` remains jobs/governance/operator scoped. |
| 10 | P0 lockdown remains intact | **PASS** | `POST /api/v1/admin/flags` still requires platform owner grant. Cron routes retain `blockAuthenticatedNonPlatformCronCaller`. Operator workbench copy confirms cron controls removed. `/admin/system` has no `ADMIN_EMAILS` bypass. Hub/Product Control Center have no leads/billing links. |
| 11 | Tests still pass | **PASS** | `bun run test -- lib/platform-admin lib/api/require-platform-admin-legacy-route.test.ts app/api/v1/admin/billing app/api/v1/admin/leads app/api/v1/admin/jobs/cron-tick/route.test.ts` → **9 files, 30 tests passed** (2026-07-03). |
| 12 | No unrelated files in Phase 1 commit | **PASS** | `ae86cb50` contains 74 files: platform-admin routes/components/lib, platform API namespace, owner/admin alias rewires, middleware, worker patch, migration report. Working tree still has unrelated unstaged items (`AGENTS.md`, `package.json`, QA/launch docs)—correctly **not** included in migration commit. |

---

## Defense-in-depth map

```
Tenant admin session
  ├─ GET /[locale]/platform-admin        → middleware gateOwnerRequest → 403
  ├─ GET /[locale]/admin/leads           → legacy layout guard → redirect /admin
  ├─ GET /api/v1/platform/leads          → middleware gate → 403
  ├─ GET /api/v1/admin/leads (alias)     → delegate → requirePlatformOwnerApi → 403
  └─ GET /[locale]/admin (hub)           → tenant layout guard → allowed (tenant-scoped)

Platform owner session
  ├─ GET /[locale]/platform-admin        → middleware + layout → 200
  ├─ GET /api/v1/platform/*              → middleware + requirePlatformOwnerApi → 200
  ├─ GET /api/v1/owner/* (alias)         → delegate + Deprecation header → 200
  └─ GET /api/v1/admin/billing/* (alias) → delegate + Deprecation header → 200
```

---

## Residual observations (non-blocking)

| Item | Severity | Notes |
|------|----------|-------|
| Dead legacy UI components | Low | `AdminLeadsClient`, `AdminBillingPilotClient`, `AdminLeadDetailClient` remain under `(dashboard)/admin/*` but pages now redirect; unreachable via routing. Safe to delete in a future hygiene slice. |
| `deprecatedTenantAdminPlatformApiResponse` unused | Low | Helper returns hard 403; admin aliases delegate instead. Security equivalent because canonical handler enforces grant. |
| `isPlatformAdminHost()` not wired | Info | Host policy helper exists; middleware still uses `OWNER_ALLOWED_HOSTS` via owner gate. No `admin.aistroyka.ai` route binding yet. |
| `/platform-admin` not in `PROTECTED_PREFIXES` | Info | Unauthenticated access gets 403 from owner gate (same pattern as legacy `/owner`), not login redirect. Acceptable for isolated control layer. |
| `GET /api/v1/admin/flags` tenant-readable | By design | P0 intentionally left GET for tenant override UI; POST remains platform-owner-only. |

---

## Commit integrity

| Commit | Message | Scope |
|--------|---------|-------|
| `8d719290` | docs: audit platform admin separation | Audit docs only |
| `962491db` | security: lock down platform admin boundary leaks | P0 guards |
| `ae86cb50` | security: separate platform admin cabinet | Phase 1 migration |

Unrelated working-tree changes (QA workflows, launch docs, `package.json`) remain **uncommitted**—correct per mission constraints.

---

## Test evidence

```bash
cd apps/web && bun run test -- \
  lib/platform-admin \
  lib/api/require-platform-admin-legacy-route.test.ts \
  app/api/v1/admin/billing \
  app/api/v1/admin/leads \
  app/api/v1/admin/jobs/cron-tick/route.test.ts
```

Result: **9 passed, 30 tests, 0 failures** (2026-07-03 14:31 UTC+2).

---

## Final verdicts

| Verdict | Value | Rationale |
|---------|-------|-----------|
| `PHASE1_ACCEPTED` | **YES** | All 12 audit checks pass. Platform admin is isolated, gated, and canonical APIs are in place with safe deprecated aliases. |
| `P0_REGRESSION` | **NO** | Flags POST lockdown, cron caller block, hub/operator UI removals, and tenant `/admin/system` guard unchanged. Billing/leads enforcement is stricter (platform API only). |
| `READY_FOR_ROMA_READONLY_PAGE` | **YES** | Dedicated `/platform-admin` surface with shell navigation; no collision with tenant `/admin`. ROMA can add a read-only page under this group without new boundary work. |
| `READY_FOR_ADMIN_HOST_DEPLOY` | **PARTIAL** | Route fallback `/[locale]/platform-admin` works on primary domain. `admin.aistroyka.ai` constant + host helper exist; DNS, Cloudflare route, and optional `OWNER_ALLOWED_HOSTS` cutover not deployed. |

---

## Recommended follow-ups (out of Phase 1 scope)

1. Delete unreachable `Admin*Client` files under `(dashboard)/admin/billing-pilot` and `leads`.
2. Wire `admin.aistroyka.ai` DNS → Cloudflare Worker route (optional host enforcement via `OWNER_ALLOWED_HOSTS`).
3. Schedule removal of `/api/v1/owner/*` and `/api/v1/admin/billing|leads/*` aliases after consumer migration window.
4. Add ROMA read-only page under `(platform-admin)/platform-admin/roma` when product-ready.
