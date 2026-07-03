# Platform Admin No-Tail Audit

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Role:** Principal Security Auditor + Release Integrity Reviewer  
**Purpose:** Strict pre-ROMA read-only gate — confirm no meaningful tails, regressions, or hidden blockers before adding `/[locale]/platform-admin/testing`.  
**Mode:** Read-only inspection. No product code changes.

**Authoritative commits reviewed:**
- P0 lockdown: `962491dbf7df1324d759a68e847a467e86f96cfb` (`962491d`)
- Phase 1 migration: `ae86cb50e30d5ab546db7c1ba9207c9aaa2fba29` (`ae86cb50`)
- Phase 1 post-audit: `82dead40d09e1af5a9256e3c5f3a2696c70c1fee` (`82dead40`)

---

## 0. Git safety

| Field | Value |
|-------|-------|
| **pwd** | `/Users/alex/Projects/AISTROYKA` |
| **branch** | `security/platform-admin-separation` |
| **SHA** | `82dead40d09e1af5a9256e3c5f3a2696c70c1fee` |
| **tracking** | `origin/security/platform-admin-separation` (pushed) |

### `git status --short` (working tree — not committed)

```
 M AGENTS.md
 M apps/web/package.json
 M package.json
?? .github/workflows/qa-platform.yml
?? apps/web/playwright.qa.config.ts
?? apps/web/tests/qa/
?? docs/audits/ADMIN_CABINET_STATE_AUDIT.md
?? docs/launch/... (P4 pilot docs)
?? docs/mobile/... (P3 Android docs)
?? docs/pilot/P2_PILOT_READINESS_CHECKLIST.md
?? docs/qa/
?? scripts/pilot/
?? scripts/qa/
```

**Interpretation:** Workspace has **uncommitted tails** (QA scaffold, package.json edits, launch/mobile/pilot docs). These are **not** in commits `962491d` / `ae86cb50` / `82dead40`. They do not pollute the audited branch HEAD but must not be accidentally bundled into the next ROMA commit.

### Last 5 commits

```
82dead40 docs: audit platform admin phase 1 migration
ae86cb50 security: separate platform admin cabinet
962491db security: lock down platform admin boundary leaks
8d719290 docs: audit platform admin separation
01706f46 docs: define ROMA OS kernel and constitution
```

---

## 1. Commit scope audit

### `962491d` — P0 lockdown

**Files:** 26 — all platform-admin/security scoped (API guards, page layouts, operator/hub UI removals, P0 report).

| Check | Result |
|-------|--------|
| ROMA docs committed | **NO** |
| QA scaffold committed | **NO** |
| package.json committed | **NO** |
| launch/mobile/pilot files | **NO** |
| Scope justified | **YES** — P0 boundary lockdown only |

### `ae86cb50` — Phase 1 migration

**Files:** 74 — platform-admin route group, platform API namespace, owner/admin aliases, middleware, worker patch, clients, tests, migration report.

| Check | Result |
|-------|--------|
| ROMA docs committed | **NO** |
| ROMA UI / product code | **NO** |
| QA scaffold committed | **NO** |
| package.json committed | **NO** |
| launch/mobile/pilot files | **NO** |
| Scope justified | **YES** — platform admin cabinet separation only |

### `82dead40` — Post-audit

**Files:** 1 — `docs/audits/PLATFORM_ADMIN_PHASE1_POST_AUDIT.md` only.

| Check | Result |
|-------|--------|
| Single-doc commit | **YES** |
| Unrelated changes | **NONE** |

### Branch history note (outside the three commits)

- `8d719290` includes `PLATFORM_ADMIN_ROMA_PLACEMENT_DECISION.md` — **audit/planning doc only**, not ROMA runtime.
- `01706f46` includes `docs/roma/*` — **ROMA constitution/architecture docs only**, predates security work; not in P0/Phase 1 commits.

**Verdict:** Commit scope for the authoritative security chain is **clean**.

---

## 2. P0 lockdown regression audit

| P0 requirement | Code evidence | Status |
|----------------|---------------|--------|
| Tenant admin cannot POST global flags | `POST /api/v1/admin/flags` calls `requirePlatformOwnerLegacyAdminRoute` before mutation (`apps/web/app/api/v1/admin/flags/route.ts:36-37`) | **PASS** |
| Tenant admin cannot trigger cron-tick | `blockAuthenticatedNonPlatformCronCaller` after cron secret (`cron-tick/route.ts:25-26`); test asserts 403 for tenant admin session | **PASS** |
| Tenant admin cannot trigger schedule-reconcile | Same pattern (`schedule-reconcile/route.ts:21-22`) | **PASS** |
| Cron-secret-only workers allowed | `requireCronSecretIfEnabled` runs **first**; `blockAuthenticatedNonPlatformCronCaller` returns null when no user session — unauthenticated cron callers pass if secret valid | **PASS** |
| Tenant admin cannot access platform billing APIs | Admin billing routes delegate to `/api/v1/platform/billing/*` → `requirePlatformOwnerApi`; no `requireTenant`/`requireAdmin` in platform namespace | **PASS** |
| Tenant admin cannot access platform billing pages | `/admin/billing-pilot/layout.tsx` → `assertPlatformOwnerLegacyAdminPageAccess` redirects non-grant holders to `/admin`; page redirects grant holders to `/platform-admin/billing` | **PASS** |
| Tenant admin cannot access platform leads APIs | Same delegation + `requirePlatformOwnerApi` on platform leads routes | **PASS** |
| Tenant admin cannot access platform leads pages | `/admin/leads/layout.tsx` guard + redirect pattern mirrors billing | **PASS** |
| `ADMIN_EMAILS` no longer grants `/admin/system` | `admin/system/page.tsx` uses tenant `createClient` + metrics only; grep shows `lib/auth/admin` **not imported anywhere** in `apps/web` | **PASS** |
| Hub/operator P0 UI removals intact | `admin/page.tsx` has no billing/leads links; `AdminProductControlCenterClient` has no leads/billing; operator copy states cron moved to platform admin | **PASS** |

**P0 regression:** **NONE detected.**

---

## 3. Platform admin separation audit

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `/platform-admin` exists | Route group `(platform-admin)/platform-admin/` — overview, billing, leads, leads/[id] | **PASS** |
| Platform owner guard on pages | Layout `assertPlatformOwnerPageAccess` + middleware `gateOwnerRequest` on `isPlatformAdminPagePath` | **PASS** |
| Not linked from tenant admin | Tenant `/admin` hub and Product Control Center have no platform-admin/owner/billing/leads links | **PASS** |
| `/admin` tenant-scoped | Under `(dashboard)/admin` with tenant layout/membership guards | **PASS** |
| Billing/leads in platform namespace | UI: `components/platform-admin/*` fetches `/api/v1/platform/*`; API: 21 handlers under `app/api/v1/platform/` | **PASS** |
| `/api/v1/platform/*` canonical | Handlers contain business logic; platform clients use this prefix exclusively | **PASS** |
| `/api/v1/owner/*` deprecated | Thin `delegateToPlatformApi` + `Deprecation: true` on all 10 owner routes | **PASS** |
| `/api/v1/admin/billing|leads/*` deprecated/guarded | Thin `delegateLegacyTenantAdminPlatformApi` + `Deprecation: true`; canonical handler enforces grant | **PASS** |
| Redirects do not bypass guards | Tenant admin hitting `/admin/leads`: layout guard → `/admin` before page redirect. Platform paths: middleware denies without grant | **PASS** |

---

## 4. Host / middleware audit

| Requirement | Evidence | Status |
|-------------|----------|--------|
| Worker does not bypass `/api/v1/platform/*` | `patch-worker-bypass-api-middleware.cjs` exempts `/api/v1/owner` and `/api/v1/platform` from API bypass | **PASS** |
| Middleware gates platform APIs | `middleware.ts` runs `gateOwnerRequest` when `isPlatformAdminApiPath` | **PASS** |
| Host policy helper exists | `lib/platform-admin/host-policy.ts` — `isPlatformAdminHost()` | **PASS** (exists) |
| Host policy wired to routing | Grep: `isPlatformAdminHost` used only in its own file | **NOT WIRED** (P2) |
| `admin.aistroyka.ai` production-ready claim | Constant documented; DNS/Cloudflare route not deployed; enforcement uses existing `OWNER_ALLOWED_HOSTS` via owner gate | **NOT FALSELY READY** — correctly **PARTIAL** |
| Route fallback safe | `PLATFORM_ADMIN_BASE_PATH = "/platform-admin"` works on primary domain without dedicated host | **PASS** |

---

## 5. Navigation / UX audit

| Requirement | Evidence | Status |
|-------------|----------|--------|
| `PlatformAdminShell` clear navigation | Overview · Billing pilot · Contact leads; header labels platform vs tenant admin | **PASS** |
| Tenant admin nav clean | No platform-only items in tenant admin hub links | **PASS** |
| Distinct labeling | “Platform admin cabinet” + “not tenant company admin” | **PASS** |
| Dead legacy clients | `AdminBillingPilotClient`, `AdminLeadsClient`, `AdminLeadDetailClient` remain under `(dashboard)/admin/*` but pages redirect — **unreachable** | **P2 hygiene** (documented, not blocker) |

**ROMA note:** Shell nav does not yet include `/testing` — expected; adding one nav item when ROMA page lands is normal follow-up, not a security blocker.

---

## 6. Test coverage audit

### Targeted run (2026-07-03)

```bash
cd apps/web && bun run test -- \
  lib/platform-admin \
  lib/api/require-platform-admin-legacy-route.test.ts \
  app/api/v1/admin/billing \
  app/api/v1/admin/leads \
  app/api/v1/admin/jobs/cron-tick/route.test.ts
```

**Result:** 9 files, **30 tests passed**, 0 failures.

### Coverage map

| Area | Tests | Status |
|------|-------|--------|
| Platform admin middleware paths | `middleware-paths.test.ts` | Covered |
| Deprecation headers | `deprecation.test.ts`, `legacy-owner-api.test.ts` | Covered |
| P0 legacy route guards | `require-platform-admin-legacy-route.test.ts` | Covered |
| Admin billing/leads alias delegation | billing + leads route tests | Covered |
| Cron tenant-admin block | `cron-tick/route.test.ts` | Covered |
| Page redirect integration | — | **Not covered** (P3 gap) |
| `/platform-admin/testing` | — | N/A (not built yet) |

Full monorepo / e2e suite not run (expensive; not required for this gate). No regressions in changed-area targeted tests.

---

## 7. ROMA read-only readiness audit

**Proposed route:** `/[locale]/platform-admin/testing`

| Criterion | Assessment |
|-----------|------------|
| Platform admin guard stable | **YES** — layout + middleware + `assertPlatformOwnerPageAccess` |
| Platform shell ready | **YES** — `PlatformAdminShell` wraps all platform-admin children |
| Navigation extensible | **YES** — add `Testing` to `NAV_ITEMS` when page ships |
| No tenant admin access path | **YES** — grant required at middleware and layout |
| No unresolved P0 | **YES** — P0 checks pass |
| Production DNS not required first | **YES** — `/platform-admin/testing` on primary domain is safe |
| Read-only artifacts safe | **YES** — if page is read-only (no mutations, no customer PII beyond existing platform console patterns) |

**Hidden blockers before ROMA read-only page:** **NONE (P0/P1).**

---

## 8. Remaining tails — blocker classification

### P0 — Must fix before ROMA

**None.**

### P1 — Should fix soon; blocks production admin host or ROMA write paths

**None** for read-only ROMA page scope.

### P2 — Hygiene / deploy readiness (non-blocking for read-only ROMA)

| Tail | Notes |
|------|-------|
| Dead `Admin*Client` files under tenant `/admin` | Unreachable; delete in hygiene slice |
| `lib/auth/admin.ts` (`ADMIN_EMAILS`) unused | Dead module; no runtime grant path |
| `isPlatformAdminHost()` not wired | Host helper preparatory only |
| `admin.aistroyka.ai` DNS/Worker routing not deployed | PARTIAL deploy readiness |
| Uncommitted workspace files (QA, package.json, launch/mobile docs) | Risk of accidental commit; keep out of ROMA PR |
| Branch history has ROMA **docs** (`01706f46`, `8d719290`) | Planning only; not product code |

### P3 — Nice to have

| Tail | Notes |
|------|-------|
| No automated redirect/guard integration tests | Manual/code audit sufficient for now |
| `deprecatedTenantAdminPlatformApiResponse` helper unused | Delegation pattern used instead; equivalent security |
| `/platform-admin` returns 403 (not login redirect) for anonymous | Consistent with legacy `/owner`; acceptable |

---

## 9. Primary question answer

> Are there any meaningful tails, regressions, or hidden blockers before we add the read-only `/platform-admin/testing` ROMA page?

**Answer: NO meaningful security or P0 blockers.**  

Phase 1 separation is intact on branch HEAD. Residual items are **P2 hygiene** (dead files, unwired host helper, uncommitted workspace pollution) and **P3 test gaps** — none prevent a read-only ROMA page under the existing `(platform-admin)` layout.

---

## Final verdicts

| Verdict | Value |
|---------|-------|
| `NO_TAIL_AUDIT_COMPLETE` | **YES** |
| `P0_REMAINING` | **NO** |
| `P1_REMAINING` | **NO** |
| `P2_TAILS` | Dead tenant-admin client files; unwired `isPlatformAdminHost`; uncommitted QA/package/launch docs in workspace; `admin.aistroyka.ai` not deployed |
| `READY_FOR_ROMA_READONLY_PAGE` | **YES** |
| `READY_FOR_ADMIN_HOST_DEPLOY` | **PARTIAL** |
| `NEXT_SAFE_ACTION` | Add read-only page at `apps/web/app/[locale]/(platform-admin)/platform-admin/testing/page.tsx` under existing layout; add optional `Testing` nav item to `PlatformAdminShell`; show static/read-only artifacts only; exclude uncommitted QA/package files from the ROMA PR |
