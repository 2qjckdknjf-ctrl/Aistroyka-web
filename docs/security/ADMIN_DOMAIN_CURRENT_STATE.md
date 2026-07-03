# Admin Domain — Current State Inventory

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Scope:** Read-only inventory of repo + deploy posture for `admin.aistroyka.ai`  
**Status:** Platform admin works on primary domain fallback; dedicated admin host **not deployed**

---

## 1. Executive summary

| Item | Current state |
|------|---------------|
| Canonical UI path | `/[locale]/platform-admin` on `aistroyka.ai` / `staging.aistroyka.ai` |
| Preferred host constant | `admin.aistroyka.ai` (`PLATFORM_ADMIN_PREFERRED_HOST`) |
| DNS for admin host | **Not created** |
| Cloudflare Worker route for admin host | **Not bound** |
| `isPlatformAdminHost()` | **Exists, not wired** to middleware routing |
| Host enforcement | Optional via `OWNER_ALLOWED_HOSTS` in owner gate (empty = all hosts allowed) |
| Cloudflare Access | **Not configured** for admin subdomain |
| Primary entry risk | Platform admin reachable on public host as fallback |

---

## 2. Cloudflare / Worker topology

### Workers (from `apps/web/wrangler.toml`, `wrangler.deploy.toml`)

| Env | Worker name | `NEXT_PUBLIC_APP_URL` |
|-----|-------------|------------------------|
| production | `aistroyka-web-production` | `https://aistroyka.ai` |
| staging | `aistroyka-web-staging` | `https://staging.aistroyka.ai` |
| dev | `aistroyka-web-dev` | (local) |

### Routes

- Production routes (`aistroyka.ai`, `www.aistroyka.ai`) are **managed manually** in Cloudflare Dashboard.
- `wrangler.toml` route blocks are **commented out** with note: *"Routes are managed manually in Cloudflare Dashboard. CI must not create/update/delete routes."*
- **No** `admin.aistroyka.ai` route or custom domain binding exists in repo or documented deploy.

### Entry / bootstrap

- Worker entry: `worker-bootstrap.js` → patches `globalThis.require`, wraps fetch with API security headers.
- OpenNext bundle: `.open-next/deploy/worker-bootstrap.js` (staging/production deploy).
- Deploy path: GitHub **Deploy Cloudflare (Staging)** → **Deploy Cloudflare (Production)** (`docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`).

### Related domains

| Host | Role |
|------|------|
| `aistroyka.ai` / `www.aistroyka.ai` | Canonical public + product + tenant |
| `staging.aistroyka.ai` | Staging |
| `aistroyka.com` / `www.aistroyka.com` | 301 redirect to `.ai` (separate redirect worker) |
| `admin.aistroyka.ai` | **Planned, not live** |

---

## 3. Application routing (platform admin)

### Constants (`apps/web/lib/platform-admin/constants.ts`)

```
PLATFORM_ADMIN_BASE_PATH     = "/platform-admin"
PLATFORM_API_PREFIX          = "/api/v1/platform"
LEGACY_OWNER_API_PREFIX      = "/api/v1/owner"
PLATFORM_ADMIN_PREFERRED_HOST = "admin.aistroyka.ai"
```

### UI routes (`apps/web/app/[locale]/(platform-admin)/platform-admin/`)

| Path | Page | Guard |
|------|------|-------|
| `/[locale]/platform-admin` | Overview console | layout + middleware |
| `/[locale]/platform-admin/billing` | Billing pilot | same |
| `/[locale]/platform-admin/leads` | Contact leads | same |
| `/[locale]/platform-admin/leads/[id]` | Lead detail | same |
| `/[locale]/platform-admin/testing` | ROMA Testing (read-only) | same |

Layout (`layout.tsx`):

- `assertPlatformOwnerPageAccess()` (defense in depth)
- `robots: { index: false, follow: false }`
- `PlatformAdminShell` nav: Overview · Billing pilot · Contact leads · ROMA Testing

### Legacy UI aliases (temporary)

| Legacy path | Behavior |
|-------------|----------|
| `/[locale]/owner` | Redirect → `/platform-admin` |
| `/[locale]/admin/billing-pilot` | Tenant admin blocked; platform owner → `/platform-admin/billing` |
| `/[locale]/admin/leads` | Same pattern → `/platform-admin/leads` |

### Canonical platform APIs (`/api/v1/platform/*` — 22 routes)

Includes: `overview`, `health`, `diagnostics`, `audit`, `users`, `tenants`, `support/tickets`, `billing/*`, `leads/*`, `testing/quality`, `critical/echo`.

All use `requirePlatformOwnerApi(request, { mode: "read"|"write"|"critical" })`.

### Deprecated API aliases

| Prefix | Count | Behavior |
|--------|-------|----------|
| `/api/v1/owner/*` | 10 routes | Delegate to `/api/v1/platform/*`; `Deprecation: true` headers |
| `/api/v1/admin/billing/*` | several | Delegate to platform billing |
| `/api/v1/admin/leads/*` | several | Delegate to platform leads |

---

## 4. Middleware and host policy

### Middleware (`apps/web/middleware.ts`)

```
Platform admin API paths  → updateSession → gateOwnerRequest → next
Platform admin page paths → updateSession → gateOwnerRequest → intl middleware
Other /api/v1/*           → lite allow-list only (no owner gate unless platform path)
```

Path detection (`lib/platform-admin/middleware-paths.ts`):

- Pages: `/owner`, `/platform-admin`
- APIs: `/api/v1/owner`, `/api/v1/platform`
- Worker bypass exception: platform + owner API prefixes **do** run middleware (patched)

### Host policy (`lib/platform-admin/host-policy.ts`)

```typescript
isPlatformAdminHost(host):
  if OWNER_ALLOWED_HOSTS set → host in comma list
  else → host === "admin.aistroyka.ai"
```

**Usage:** Grep shows `isPlatformAdminHost` is **only referenced in its own file and tests** — not in `middleware.ts`.

### Owner gate (`lib/platform-owner/middleware-owner-gate.ts`)

`ownerHostAllowed(request)`:

- If `OWNER_ALLOWED_HOSTS` empty/unset → **returns true** (all hosts allowed)
- If set → host must be in comma-separated list

Gate order: host → IP allowlist → surface cookie (pages) → API secret (optional) → session → grant → method/role → rate limit.

### API guard (`lib/platform-owner/require-platform-owner-api.ts`)

Mirrors middleware rules + DB audit rows (`platform_owner_audit_log`), step-up for critical mode.

---

## 5. Authorization model (current)

### Grant table

- `platform_owner_grants` — one row per platform operator user
- Roles: `OWNER`, `OWNER_OPERATOR`, `OWNER_READONLY`

### Tenant admin separation

- Tenant `/admin` uses `tenant_members` (`owner`/`admin` roles)
- Platform admin requires `platform_owner_grants` — tenant admin **403** on platform pages/APIs (P0 lockdown verified in `PLATFORM_ADMIN_NO_TAIL_AUDIT.md`)

### Optional env hardening (exist today, not required in prod)

| Variable | Purpose | Default if unset |
|----------|---------|------------------|
| `OWNER_ALLOWED_HOSTS` | Restrict owner/platform surfaces to listed hosts | All hosts allowed |
| `OWNER_IP_ALLOWLIST` | IP allowlist for owner gate | No IP filter |
| `OWNER_GATE_SECRET` | `X-Owner-Key` for selected API paths | Not required |
| `OWNER_STEP_UP_SECRET` | HMAC step-up for critical mutations | Critical routes 503 if missing |
| `OWNER_TOTP_SECRET` | Optional TOTP header | Not enforced |
| `OWNER_AUDIT_DENIED` | Audit denied API attempts to DB | Off |

---

## 6. Security headers

Source: `apps/web/lib/security-headers.ts`

| Surface | Applied by |
|---------|------------|
| HTML pages | `middleware.ts` — CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS (prod) |
| `/api/v1/*` | `worker-bootstrap.js` wrapper (OpenNext bypasses middleware for most API) |
| Platform admin layout | `robots: noindex, nofollow` in metadata |

Smoke: `bash scripts/smoke/security_headers.sh` (targets public `aistroyka.ai` today — **not** admin host).

---

## 7. ROMA / Engineering Intelligence (context only)

- Route: `/[locale]/platform-admin/testing`
- Server: `buildRomaQualityDashboard()` + `buildRomaEngineeringIntelligence()`
- API: `GET /api/v1/platform/testing/quality` (read-only, `requirePlatformOwnerApi`)
- ROMA dashboard notes `adminHostDeployed: false` when `OWNER_ALLOWED_HOSTS` unset

**No ROMA UI changes in admin-domain plan.**

---

## 8. Existing documentation map

| Doc | Relevance |
|-----|-----------|
| `docs/audits/PLATFORM_ADMIN_P0_LOCKDOWN_REPORT.md` | P0 boundary baseline |
| `docs/audits/PLATFORM_ADMIN_PHASE1_MIGRATION_REPORT.md` | Phase 1 migration; `ADMIN_HOST_READY = PARTIAL` |
| `docs/audits/PLATFORM_ADMIN_PHASE1_POST_AUDIT.md` | Deploy readiness partial |
| `docs/audits/PLATFORM_ADMIN_NO_TAIL_AUDIT.md` | `isPlatformAdminHost` not wired |
| `docs/audits/PLATFORM_ADMIN_SECURITY_BOUNDARY_REPORT.md` | Target boundary diagram |
| `docs/audits/PLATFORM_ADMIN_TARGET_RESTRUCTURE_PLAN.md` | Prior restructure plan |
| `docs/security/PLATFORM_OWNER_CABINET_SECURITY_AUDIT.md` | Owner gate layers |
| `docs/security/SECURITY_HEADERS_POLICY.md` | Header application model |
| `docs/audits/ROMA_UX_TRUST_HARDENING_REPORT.md` | ROMA owner UX (recent) |

---

## 9. Gap summary (current → target)

| Gap | Severity | Notes |
|-----|----------|-------|
| No `admin.aistroyka.ai` DNS | P0 deploy blocker | Owner Cloudflare action |
| No Worker route/custom domain | P0 deploy blocker | Same Worker as production |
| No Cloudflare Access | P0 security gap | Zero Trust before app |
| `isPlatformAdminHost` unwired | P1 code gap | Middleware uses generic `OWNER_ALLOWED_HOSTS` only |
| Public host serves `/platform-admin` | P1 exposure | Fallback works; not canonical entry |
| `OWNER_ALLOWED_HOSTS` optional | P1 | Must become `admin.aistroyka.ai` in prod |
| `NEXT_PUBLIC_APP_URL` = public host | P2 | May need admin-aware URL helpers for redirects |
| Security header smoke excludes admin host | P2 | Add admin host to validation checklist |
| Legacy `/owner` + admin aliases | P3 | Deprecation cleanup post-cutover |

---

## 10. Inventory verdict

**Current state is functionally complete for platform admin on primary domain fallback.**  
**Dedicated admin host architecture is designed but not implemented in DNS, Cloudflare, or middleware host routing.**
