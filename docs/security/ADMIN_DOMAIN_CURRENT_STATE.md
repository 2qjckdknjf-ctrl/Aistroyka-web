# Admin Domain — Current State Inventory

**Date:** 2026-08-03  
**Baseline:** `origin/main` (post Phase 1–2 platform-admin separation; PRs #182–#186)  
**Scope:** Operator / developer inventory for `admin.aistroyka.ai` and platform-admin surfaces  
**Status:** Phase 1–2 **live**. Phase 3 (`OWNER_ALLOWED_HOSTS` hard cutover) **deferred**.

> Supersedes the 2026-07-03 inventory that claimed DNS/Access/`isPlatformAdminHost` were unwired. That snapshot is obsolete — see §8 doc map.

---

## 1. Executive summary

| Item | Current state |
|------|---------------|
| Canonical entry | `https://admin.aistroyka.ai/{locale}/platform-admin` |
| Preferred host constant | `admin.aistroyka.ai` (`PLATFORM_ADMIN_PREFERRED_HOST`) |
| DNS / Worker / Access | Deployed and validated (Phase 1–2 reports) |
| App host routing | **Wired** in `middleware.ts` via `host-routing.ts` + `host-policy.ts` |
| Public-host fallback | `/{locale}/platform-admin` still works on `aistroyka.ai` while `OWNER_ALLOWED_HOSTS` unset |
| Phase 3 hard cutover | Deferred — do **not** set `OWNER_ALLOWED_HOSTS` without an explicit cutover plan |

---

## 2. Canonical entry and dual auth

### Entry URLs

| Host | Path | Role |
|------|------|------|
| `admin.aistroyka.ai` | `/{locale}/platform-admin` | Canonical platform cabinet |
| `admin.aistroyka.ai` | `/{locale}/platform-admin/testing` | ROMA Testing (read-only) |
| `aistroyka.ai` / `staging.aistroyka.ai` | `/{locale}/platform-admin` | Compatibility fallback (Phase 3 not applied) |

Default locale for admin-host landing redirects is `ru` (`resolvePlatformAdminLandingPath`).

### Dual auth (Access ≠ Supabase)

Operators must clear **both** layers:

1. **Cloudflare Access** on `admin.aistroyka.ai` (edge perimeter).
2. **Supabase session** + row in `platform_owner_grants`.

Access login alone does **not** create a Supabase session. Unauthenticated page hits should redirect to `/{locale}/login?next=…` (middleware sets `X-Auth-Redirect: platform-admin-login`). Layout defense-in-depth (`assertPlatformOwnerPageAccess`):

- no / stale session → **redirect** to login
- no grant / host/IP/surface deny → **forbidden**

Incident archaeology: `docs/security/PLATFORM_ADMIN_FORBIDDEN_ROOT_CAUSE_REPORT.md`.

---

## 3. Host routing truth table

Code: `apps/web/lib/platform-admin/host-policy.ts`, `host-routing.ts`, wired in `apps/web/middleware.ts`.

### Host classification

| Helper | Behavior |
|--------|----------|
| `isPlatformAdminHost(host)` | If `OWNER_ALLOWED_HOSTS` set → host in comma list; else → `admin.aistroyka.ai` |
| `resolveHostProfile(host)` | `platform_admin` \| `public_product` \| `unknown` → response header `X-Aistroyka-Host-Profile` |

### Admin host — pages

| Path (locale-stripped) | Behavior |
|------------------------|----------|
| `/`, marketing (`/features`, …), tenant (`/dashboard`, `/admin`, `/portal`, …) | **307** → `/{locale}/platform-admin`; header `X-Aistroyka-Host-Routing: platform_admin_landing` |
| `/platform-admin/*`, `/owner/*` | Allow (owner gate applies) |
| `/login`, `/register`, `/telegram/*` | Allow (auth) |

### Admin host — APIs

| Path | Behavior |
|------|----------|
| `/api/v1/health` | Allowed (Access still gates unauthenticated edge access) |
| `/api/v1/platform/*` (and legacy `/api/v1/owner/*` paths classified as platform) | Allowed → `gateOwnerRequest` |
| Other `/api/v1/*` | **403** `{ "error": "admin_host_api_forbidden" }` |

### Public host

Product routing unchanged. `/{locale}/platform-admin` retained as fallback until Phase 3.

---

## 4. Application surfaces

### Constants (`apps/web/lib/platform-admin/constants.ts`)

```
PLATFORM_ADMIN_BASE_PATH      = "/platform-admin"
PLATFORM_API_PREFIX           = "/api/v1/platform"
LEGACY_OWNER_API_PREFIX       = "/api/v1/owner"
PLATFORM_ADMIN_PREFERRED_HOST = "admin.aistroyka.ai"
```

### UI routes (`apps/web/app/[locale]/(platform-admin)/platform-admin/`)

| Path | Page |
|------|------|
| `/[locale]/platform-admin` | Overview |
| `/[locale]/platform-admin/billing` | Billing pilot |
| `/[locale]/platform-admin/leads` | Contact leads |
| `/[locale]/platform-admin/leads/[id]` | Lead detail |
| `/[locale]/platform-admin/testing` | ROMA Testing |

Shell nav (`shell-nav.ts`): Overview · Billing pilot · Contact leads · **ROMA Testing**.

Legacy UI aliases still redirect into `/platform-admin` (`/owner`, selected `/admin/*` platform pages).

### Platform APIs

Canonical prefix `/api/v1/platform/*` — all use `requirePlatformOwnerApi(request, { mode: "read"|"write"|"critical" })`.  
Deprecated aliases under `/api/v1/owner/*` and selected `/api/v1/admin/*` still delegate with `Deprecation` headers.

---

## 5. ROMA Testing surface

| Concern | Truth |
|---------|--------|
| Route | `/[locale]/platform-admin/testing` |
| Server composition | `buildRomaQualityDashboard()` + `buildRomaEngineeringIntelligence(dashboard)` in the page RSC |
| Client | `PlatformAdminTestingClient` — props only; **no** client-side quality fetch / run buttons |
| Live probes | 15 sources in `LIVE_SOURCE_CATALOG` (`roma-live-probes.ts`) |
| Execution | `testExecutionEnabled: false` (read-only dashboard) |
| `adminHostDeployed` signal | `false` when `OWNER_ALLOWED_HOSTS` unset; `null` when set (dashboard field, not DNS truth) |
| API | `GET /api/v1/platform/testing/quality` → `{ data: RomaQualityDashboard }` **only** — intelligence is page-side, not in this JSON |

Framework design docs under `docs/roma/` describe the ROMA OS concept layer — **not** this cabinet UI. Product/UI change reports live under `docs/audits/ROMA_*`.

---

## 6. Optional env hardening

| Variable | Purpose | Default if unset |
|----------|---------|------------------|
| `OWNER_ALLOWED_HOSTS` | Restrict owner/platform surfaces + classify admin host | Empty = all hosts for owner gate; admin-host routing defaults to `admin.aistroyka.ai` |
| `OWNER_IP_ALLOWLIST` | IP allowlist for owner gate | No IP filter |
| `OWNER_GATE_SECRET` | `X-Owner-Key` for selected API paths | Not required |
| `OWNER_STEP_UP_SECRET` | HMAC step-up for critical mutations | Critical routes 503 if missing |
| `OWNER_TOTP_SECRET` | Optional TOTP header | Not enforced |
| `OWNER_AUDIT_DENIED` | Audit denied API attempts to DB | Off |

`OWNER_ALLOWED_HOSTS` is commented in `apps/web/wrangler.deploy.toml` as Phase 3. See also `docs/ENVIRONMENT-VARIABLES.md`.

---

## 7. Local / CI validation

```bash
cd apps/web
bunx vitest run \
  lib/platform-admin/host-routing.test.ts \
  middleware.host-routing.test.ts \
  lib/platform-admin/host-policy.test.ts \
  lib/platform-admin/middleware-paths.test.ts \
  lib/platform-admin/roma-quality-dashboard.service.test.ts \
  lib/platform-admin/roma-engineering-intelligence.test.ts \
  lib/platform-admin/roma-live-probes.test.ts
```

Optional local Host-header smoke (dev server running):

```bash
curl -sI -H "Host: admin.aistroyka.ai" http://localhost:3000/
# Expect: 307 Location …/ru/platform-admin, X-Aistroyka-Host-Routing: platform_admin_landing

curl -sI -H "Host: aistroyka.ai" http://localhost:3000/
# Expect: product locale redirect — not platform-admin landing
```

Operator checklist with live curl probes: `docs/security/ADMIN_DOMAIN_VALIDATION_CHECKLIST.md`.  
Security header smoke targets public hosts only today (`docs/ops/SECURITY_HEADERS_LIVE_SMOKE.md`) — admin host is Access-gated and is not in that allowlist.

---

## 8. Documentation map

| Doc | Role |
|-----|------|
| **This file** | Current inventory (start here) |
| `ADMIN_DOMAIN_PHASE1_EXECUTION_REPORT.md` | DNS/TLS/Worker/Access evidence |
| `ADMIN_DOMAIN_PHASE2_HOST_ROUTING_REPORT.md` | App routing implementation |
| `ADMIN_DOMAIN_PHASE2_DEPLOY_VALIDATION_REPORT.md` | Production deploy validation |
| `ADMIN_DOMAIN_VALIDATION_CHECKLIST.md` | Operator curl checklist |
| `PLATFORM_ADMIN_FORBIDDEN_ROOT_CAUSE_REPORT.md` | Access vs Supabase incident RCA |
| `ADMIN_DOMAIN_*_PLAN.md` / `*_ARCHITECTURE.md` / `*_SECURITY_MODEL.md` | Design / rollout (historical plans) |
| `docs/audits/PLATFORM_ADMIN_*` | Boundary / migration audits (point-in-time) |
| `docs/audits/ROMA_*` | ROMA Testing product change reports |
| `docs/roma/*` | ROMA framework design — not the cabinet UI |

---

## 9. Open gaps (Phase 3 only)

| Gap | Notes |
|-----|-------|
| `OWNER_ALLOWED_HOSTS` unset | Owner gate still allows public host; admin-host routing still defaults to `admin.aistroyka.ai` |
| Public `/platform-admin` fallback | Intentional until hard cutover |
| Legacy `/owner` + admin aliases | Deprecation cleanup after cutover |
| Security header live smoke | Does not probe Access-gated admin host |

---

## 10. Inventory verdict

**Phase 1–2 are implemented and deployed:** admin host is the canonical entry, middleware host routing is wired, Cloudflare Access is the edge perimeter, and platform admin remains available on the public host as a transitional fallback.

**Phase 3 is not done:** do not claim hard host isolation until `OWNER_ALLOWED_HOSTS` is set and public-host fallback policy is explicitly changed.
