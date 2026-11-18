# Admin Domain — Phase 2 Deploy Validation Report

**Date:** 2026-07-04  
**Branch (source):** `security/platform-admin-separation`  
**Production deploy SHA:** `968136eb` (`buildStamp.sha7`: `968136e`)  
**Validator:** Principal Release Engineer + Platform Security Validator (automated + live probes)

---

## 1. Git / release readiness

| Check | Result | Evidence |
|-------|--------|----------|
| Branch committed Phase 1–2 work | **PASS** | PR [#182](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/182) merged 2026-07-03T16:17:36Z |
| Merge commit on `main` | **PASS** | `968136eb` — *feat: platform admin domain separation (Phase 1–2)* |
| Unrelated dirty files excluded from release | **PASS** | Merge commit contains platform-admin / admin-domain scope only; workspace dirty files (`AGENTS.md`, `package.json`, QA/pilot docs) **not** in merge |
| Local branch vs `main` | **NOTE** | Local `security/platform-admin-separation` at `d1b981f8` is **behind** `origin/main` (`968136eb`); production truth is **`main`** |
| Pre-deploy production health | **PASS** | `GET https://aistroyka.ai/api/v1/health` → `ok: true` before validation run |

### Release path executed

1. PR #182 → `main` (CI **check** SUCCESS, Vercel SUCCESS, Workers Builds SUCCESS)
2. **Deploy Cloudflare (Staging)** — SUCCESS (`buildStamp.sha7`: `968136e`, 2026-07-03 16:18)
3. **Deploy Cloudflare (Production)** — SUCCESS (`buildStamp.sha7`: `968136e`, 2026-07-03 16:21)

**Phase 3 gates intentionally not applied:** `OWNER_ALLOWED_HOSTS` not set; public `/platform-admin` fallback retained; no legacy alias removal.

---

## 2. Pre-deploy / post-merge targeted tests

**Command:**

```bash
cd apps/web
bunx vitest run \
  lib/platform-admin/host-routing.test.ts \
  middleware.host-routing.test.ts \
  lib/platform-admin/host-policy.test.ts \
  lib/platform-admin/middleware-paths.test.ts \
  lib/api/require-platform-admin-legacy-route.test.ts \
  lib/platform-admin/deprecation.test.ts \
  lib/platform-admin/roma-quality-dashboard.page.test.ts \
  lib/platform-admin/roma-quality-dashboard.service.test.ts \
  lib/platform-admin/legacy-owner-api.test.ts \
  app/api/v1/admin/jobs/cron-tick/route.test.ts \
  lib/platform-owner/owner-capabilities.test.ts \
  lib/platform-owner/client-ip.test.ts \
  lib/platform-admin/roma-engineering-intelligence.test.ts \
  lib/platform-admin/roma-live-probes.test.ts
```

| Suite | Tests | Result |
|-------|-------|--------|
| Host routing (unit + middleware) | 15 | **PASS** |
| Host policy + middleware paths | — | **PASS** |
| Platform API alias / legacy routes | — | **PASS** |
| ROMA quality dashboard (page + service + probes + intelligence) | — | **PASS** |
| P0 lockdown (cron-tick, owner capabilities, legacy owner API) | — | **PASS** |
| **Total** | **69** | **PASS** |

---

## 3. Live validation — production (2026-07-04)

### 3.1 Public host (`aistroyka.ai`) — unauthenticated

| Probe | Expected | Observed | Pass |
|-------|----------|----------|------|
| `GET /api/v1/health` | `ok: true` | `ok: true`, `sha7: 968136e` | **YES** |
| `GET /` | Locale redirect (product) | **307** → `/ru` | **YES** |
| `GET /ru/features` | Marketing page | **200**, `x-aistroyka-host-profile: public_product` | **YES** |
| `GET /ru/platform-admin` | Owner gate (compat fallback) | **403** (platform owner required) | **YES** |
| `GET /api/v1/platform/overview` | Owner gate | **403** JSON | **YES** |
| `POST /api/v1/admin/flags` | P0 tenant block | **403** `platform_admin_required` | **YES** |

**Public host unchanged** — product routing, health, and compatibility fallback behave as designed.

### 3.2 Admin host (`admin.aistroyka.ai`) — unauthenticated (Cloudflare Access perimeter)

| Probe | Expected | Observed | Pass |
|-------|----------|----------|------|
| `GET /` | Access login (not app `/ru`) | **302** → `*.cloudflareaccess.com` | **YES** |
| `GET /api/v1/health` | Access login (not public JSON) | **302** → Access login | **YES** |
| `GET /ru/dashboard` | Access login before app | **302** → Access login | **YES** |
| `GET /api/v1/admin/flags` | Access login before app | **302** → Access login | **YES** |
| `GET /api/v1/platform/overview` | Access login before app | **302** → Access login | **YES** |

**Access perimeter OK** — unauthenticated traffic does not reach app middleware on admin host.

### 3.3 Admin host — post-Access app-layer (owner session required)

These checks require a **Cloudflare Access session cookie** plus **platform owner app auth**. Not executable from CI/automation without owner credentials.

| Probe | Expected (post-Access) | Status |
|-------|------------------------|--------|
| `GET /` after Access login | **307** → `/ru/platform-admin`, header `X-Aistroyka-Host-Routing: platform_admin_landing` | **NOT TESTED** — owner smoke |
| `GET /ru/features` after Access | Redirect to `/ru/platform-admin` | **NOT TESTED** |
| `GET /ru/dashboard` after Access | Redirect to `/ru/platform-admin` | **NOT TESTED** |
| `GET /ru/platform-admin/testing` after Access + owner login | ROMA testing page loads | **NOT TESTED** |
| `GET /api/v1/admin/flags` after Access, no app owner | **403** `admin_host_api_forbidden` | **NOT TESTED** |
| `GET /api/v1/platform/overview` after Access, no app owner | **403** platform owner gate | **NOT TESTED** |

**Confidence without live session:** Deployed SHA `968136e` includes `host-routing.ts` + middleware wiring; **15 middleware/host-routing tests** cover the post-Access behavior with `Host: admin.aistroyka.ai` headers.

### 3.4 Staging cross-check

| Probe | Result |
|-------|--------|
| `GET https://staging.aistroyka.ai/api/v1/health` | `ok: true`, `sha7: 968136e`, `env: staging` |
| Admin host Access on staging hostname probe | **302** Access (admin domain binding shared) |

---

## 4. Owner post-Access smoke checklist (required before Phase 3)

Complete in browser after Cloudflare Access login to `admin.aistroyka.ai`:

1. Open `https://admin.aistroyka.ai/` → lands on `/ru/platform-admin` (not marketing home).
2. Open `https://admin.aistroyka.ai/ru/platform-admin/testing` → ROMA testing dashboard renders.
3. Open `https://admin.aistroyka.ai/ru/dashboard` → redirected to `/ru/platform-admin`.
4. DevTools: `GET /api/v1/admin/flags` → **403** `admin_host_api_forbidden`.
5. DevTools: `GET /api/v1/platform/overview` without owner session → **403** platform owner gate; with owner session → **200**.
6. Confirm `https://aistroyka.ai/ru/platform-admin` still reachable (compat) on public host.

---

## 5. Constraints verified (not violated)

| Constraint | Status |
|------------|--------|
| `OWNER_ALLOWED_HOSTS` not enabled | **YES** — not set on Worker |
| Legacy aliases not removed | **YES** |
| Public `/platform-admin` not hard-blocked | **YES** — 403 is owner gate, not host block |
| ROMA features untouched in this validation | **YES** — read-only test verification |
| Phase 3 not started | **YES** |

---

## 6. Related documents

- Phase 1: `docs/security/ADMIN_DOMAIN_PHASE1_EXECUTION_REPORT.md`
- Phase 2 implementation: `docs/security/ADMIN_DOMAIN_PHASE2_HOST_ROUTING_REPORT.md`
- Target architecture: `docs/security/ADMIN_DOMAIN_TARGET_ARCHITECTURE.md`

---

## 7. Final verdicts

| Verdict | Value | Rationale |
|---------|-------|-----------|
| `DEPLOY_VALIDATION_COMPLETE` | **YES** | Merged, staged, production deployed at `968136e`; 69 tests pass; unauthenticated live probes pass |
| `ADMIN_HOST_LIVE_ROUTING_OK` | **PARTIAL** | Access perimeter verified; post-Access app redirects **not live-tested** (owner smoke pending) |
| `PUBLIC_HOST_OK` | **YES** | Health, marketing, compat fallback, owner gates unchanged |
| `ACCESS_OK` | **YES** | All unauthenticated admin probes → Cloudflare Access |
| `ROMA_TESTING_PAGE_OK` | **NOT TESTED** | Requires Access + platform owner session |
| `READY_FOR_PHASE3_HOST_ENFORCEMENT` | **NO** | Complete §4 owner smoke before `OWNER_ALLOWED_HOSTS` / public redirect |

### Recommended next step

Owner completes **§4 post-Access smoke** → update this report with smoke timestamps → then proceed to Phase 3 (`OWNER_ALLOWED_HOSTS=admin.aistroyka.ai` on production Worker).
