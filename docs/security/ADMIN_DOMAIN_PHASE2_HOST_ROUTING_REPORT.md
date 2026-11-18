# Admin Domain — Phase 2 Host Routing Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Executor:** Engineering (app middleware + unit tests)

---

## 1. Objective

Make `admin.aistroyka.ai` behave as the canonical Platform Admin host in the application layer while keeping the public product host (`aistroyka.ai`) unchanged during transition.

**Prerequisites (Phase 1):** DNS/TLS/Worker binding live; Cloudflare Access gates unauthenticated traffic on the admin host.

---

## 2. Implementation summary

| Area | Change |
|------|--------|
| Host routing module | `apps/web/lib/platform-admin/host-routing.ts` — pure redirect/allow decisions |
| Middleware wiring | `apps/web/middleware.ts` — admin host page redirects + API allowlist |
| Host profile header | `X-Aistroyka-Host-Profile: platform_admin` on admin host (existing `host-policy.ts`) |
| Redirect marker | `X-Aistroyka-Host-Routing: platform_admin_landing` on admin host redirects |
| `OWNER_ALLOWED_HOSTS` | **Not set** — Phase 3 enforcement deferred |

### Admin host page routing

| Request path (locale-stripped) | Behavior |
|--------------------------------|----------|
| `/` | 307 → `/{locale}/platform-admin` (default locale `ru`) |
| Marketing (`/features`, `/pricing`, …) | 307 → `/{locale}/platform-admin` |
| Tenant cabinet (`/dashboard`, `/admin`, `/portal`, …) | 307 → `/{locale}/platform-admin` |
| `/platform-admin`, `/owner/*` | Allow (platform owner gate applies) |
| `/login`, `/register`, `/telegram/*` | Allow (auth flows) |

### Admin host API routing

| Path | Behavior |
|------|----------|
| `/api/v1/health` | Pass-through (Cloudflare Access gates unauthenticated access externally) |
| `/api/v1/platform/*` | Pass-through → existing `gateOwnerRequest` platform owner auth |
| Other `/api/v1/*` | **403** `{ "error": "admin_host_api_forbidden" }` |

### Public host (unchanged compatibility)

| Path | Behavior |
|------|----------|
| `/` | Normal next-intl public routing |
| `/{locale}/platform-admin` | **Retained** — legacy fallback during transition |
| `/api/v1/health` | Unchanged public health |
| `/api/v1/platform/*` | Unchanged owner gate (no host block yet) |

---

## 3. Files changed

| File | Purpose |
|------|---------|
| `apps/web/lib/platform-admin/host-routing.ts` | Admin host redirect/allow rules |
| `apps/web/lib/platform-admin/host-routing.test.ts` | Unit tests |
| `apps/web/middleware.ts` | Wire routing before intl + API allowlist |
| `apps/web/middleware.host-routing.test.ts` | Middleware integration tests (Host header) |
| `apps/web/lib/platform-admin/host-policy.ts` | Comment update (profile used for routing) |

**Not changed (by design):** legacy `/platform-admin` on public host, ROMA features, `OWNER_ALLOWED_HOSTS`, Cloudflare Access config.

---

## 4. Validation

### Automated tests

```bash
cd apps/web
bunx vitest run lib/platform-admin/host-routing.test.ts middleware.host-routing.test.ts
```

Coverage:

- Admin host `/` → `/ru/platform-admin`
- Admin host marketing/tenant paths → platform-admin landing
- Public host `/` uses intl middleware (no admin redirect)
- Public host `/ru/platform-admin` compatibility preserved
- `/api/v1/platform/*` flows through owner gate on admin host
- Tenant APIs blocked on admin host; health pass-through on both hosts

### Local Host header smoke (optional)

```bash
# Requires local dev server; examples use curl -H Host:
curl -sI -H "Host: admin.aistroyka.ai" http://localhost:3000/
# Expect: 307 Location: .../ru/platform-admin, X-Aistroyka-Host-Routing: platform_admin_landing

curl -sI -H "Host: aistroyka.ai" http://localhost:3000/
# Expect: 200 or locale redirect — not platform-admin landing
```

Production admin host is additionally gated by Cloudflare Access before the Worker; validate post-deploy with an Access session.

---

## 5. Phase 3 readiness

| Gate | Status |
|------|--------|
| Admin host routes to platform admin | **YES** (app layer) |
| Public host unaffected | **YES** |
| Platform APIs protected (owner gate + Access) | **YES** |
| `OWNER_ALLOWED_HOSTS` enforcement | **Deferred** — enable after deploy validation + public-host redirect policy |

Recommended Phase 3 steps:

1. Deploy branch to staging → smoke admin host redirects with Access session
2. Set `OWNER_ALLOWED_HOSTS=admin.aistroyka.ai` on production Worker
3. Optionally redirect public `/{locale}/platform-admin` → admin host (301) after monitoring

---

## 6. Verdicts

| Verdict | Value |
|---------|-------|
| `ADMIN_DOMAIN_PHASE2_COMPLETE` | **YES** (code + tests; production deploy pending merge) |
| `ADMIN_HOST_ROUTES_TO_PLATFORM_ADMIN` | **YES** |
| `PUBLIC_HOST_UNAFFECTED` | **YES** |
| `PLATFORM_APIS_PROTECTED` | **YES** (Access + owner gate; tenant APIs blocked on admin host) |
| `READY_FOR_PHASE3_HOST_ENFORCEMENT` | **YES** (after staging deploy validation) |

---

## 7. Related documents

- Phase 1: `docs/security/ADMIN_DOMAIN_PHASE1_EXECUTION_REPORT.md`
- Target architecture: `docs/security/ADMIN_DOMAIN_TARGET_ARCHITECTURE.md`
- Rollout plan: `docs/security/ADMIN_DOMAIN_ROLLOUT_PLAN.md`
