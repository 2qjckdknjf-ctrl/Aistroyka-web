# Admin Domain — Target Architecture

**Date:** 2026-07-03  
**Canonical host:** `admin.aistroyka.ai`  
**Status:** Design target — not implemented

---

## 1. Design principles

1. **`admin.aistroyka.ai` is the canonical Platform Admin host** — primary entry for operators.
2. **`aistroyka.ai` remains the public/product/tenant host** — marketing, dashboard, portal, tenant admin.
3. **Platform Admin UI must not be a primary entry on the public host** — compatibility redirect only during transition.
4. **Tenant admin must never access platform admin** — separate grant table, separate host, separate middleware path.
5. **Platform APIs require platform-owner authorization** — `platform_owner_grants` + tiered roles.
6. **Cloudflare Access protects the admin host before the application** — identity at edge.
7. **Application RBAC remains mandatory** — Access is not a substitute for grants.
8. **No secrets in client** — gate secrets, step-up, cron keys server-only.
9. **Every platform action is auditable** — `platform_owner_audit_log` + gate event logs.

---

## 2. Domain topology (target)

```
                    Internet
                        │
                        ▼
              ┌─────────────────────┐
              │  Cloudflare DNS     │
              │  Zone: aistroyka.ai │
              └─────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  aistroyka.ai    www.aistroyka.ai   admin.aistroyka.ai
  (public)        (public)           (platform admin)
        │               │               │
        │               │               ▼
        │               │      ┌────────────────────┐
        │               │      │ Cloudflare Access  │
        │               │      │ + MFA policy       │
        │               │      └─────────┬──────────┘
        │               │                ▼
        └───────────────┴────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ aistroyka-web-      │
              │ production Worker   │
              │ (OpenNext)          │
              └─────────┬───────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
     Host = aistroyka.ai      Host = admin.aistroyka.ai
     Public + tenant routes   Platform admin only
     Block /platform-admin    Allow /platform-admin
     as primary entry          Block public/marketing
```

### Host responsibilities

| Host | Serves | Does not serve (target) |
|------|--------|-------------------------|
| `aistroyka.ai` | Public site, login, dashboard, portal, tenant `/admin` | Platform admin cabinet as primary; direct `/platform-admin` → redirect or 404 |
| `www.aistroyka.ai` | Same as apex (or redirect to apex) | Platform admin |
| `admin.aistroyka.ai` | `/[locale]/platform-admin/*`, `/api/v1/platform/*` | Marketing homepage, tenant dashboard, tenant `/admin` |
| `staging.aistroyka.ai` | Staging mirror (optional `admin-staging.aistroyka.ai` later) | — |

---

## 3. Request routing model (target)

### Admin host (`admin.aistroyka.ai`)

| Request | Target behavior |
|---------|-----------------|
| `GET /` | 302 → `/ru/platform-admin` (or locale negotiation) |
| `GET /[locale]/platform-admin/*` | Platform admin shell (if grant + Access) |
| `GET /api/v1/platform/*` | Platform APIs (grant + Access JWT forwarded) |
| `GET /[locale]/dashboard`, `/admin`, public marketing | **404 or 302 to `aistroyka.ai`** |
| `GET /api/v1/*` (non-platform) | **403** unless explicitly allowlisted (health for ops) |

### Public host (`aistroyka.ai`)

| Request | Target behavior |
|---------|-----------------|
| `GET /[locale]/platform-admin/*` | **Compatibility window:** 302 → `https://admin.aistroyka.ai/...` with deprecation header; **post-cutover:** 404 |
| `GET /api/v1/platform/*` | **403** — platform APIs admin-host only |
| `GET /api/v1/owner/*` | **Deprecation window:** delegate with `Deprecation` header; **post-cutover:** 410 or redirect |
| Tenant + public routes | Unchanged |

---

## 4. Middleware host enforcement (target code — not implemented)

Proposed logic (future implementation):

```
resolveHostContext(request):
  if isPlatformAdminHost(host):
    mode = "admin_host"
  elif isPublicProductHost(host):
    mode = "public_host"
  else:
    mode = "unknown" → 403

admin_host:
  - allow platform admin pages + platform APIs only
  - redirect / → /ru/platform-admin
  - deny tenant dashboard, portal, marketing as primary surfaces

public_host:
  - deny /platform-admin (redirect to admin host during transition)
  - deny /api/v1/platform/* 
  - allow tenant + public routes

both:
  - gateOwnerRequest unchanged for platform paths
  - OWNER_ALLOWED_HOSTS=admin.aistroyka.ai (required in prod)
```

Wire `isPlatformAdminHost()` into middleware **and** align with `ownerHostAllowed()`.

---

## 5. Environment configuration (target production)

| Variable | Target value | Notes |
|----------|--------------|-------|
| `OWNER_ALLOWED_HOSTS` | `admin.aistroyka.ai` | **Required** in production |
| `NEXT_PUBLIC_APP_URL` | `https://aistroyka.ai` | Stays public canonical URL for product |
| `PLATFORM_ADMIN_PUBLIC_URL` (new, optional) | `https://admin.aistroyka.ai` | For links in ROMA/dashboard emails |
| `OWNER_IP_ALLOWLIST` | Owner-defined CIDRs | Recommended for prod operators |
| `OWNER_AUDIT_DENIED` | `1` | Audit denied attempts |
| Cloudflare Access | Application on `admin.aistroyka.ai` | Dashboard config, not env var |

Staging recommendation:

- Phase 1: test Access on `admin-staging.aistroyka.ai` OR path-based staging gate
- `OWNER_ALLOWED_HOSTS=admin-staging.aistroyka.ai,staging.aistroyka.ai` (temporary dual during validation)

---

## 6. API namespace (unchanged, host-scoped)

| Namespace | Host | Auth |
|-----------|------|------|
| `/api/v1/platform/*` | `admin.aistroyka.ai` | `requirePlatformOwnerApi` |
| `/api/v1/owner/*` | Deprecated — admin host only during transition | Delegate |
| `/api/v1/admin/billing|leads/*` | Deprecated | Delegate |
| Tenant APIs | `aistroyka.ai` | Tenant RBAC |

---

## 7. ROMA placement (target)

- **URL:** `https://admin.aistroyka.ai/ru/platform-admin/testing` (locale prefix retained)
- **Access:** Cloudflare Access → Supabase session → `platform_owner_grants`
- **Mode:** Read-only (no execution buttons)
- **Not on public host** as primary entry post-cutover

---

## 8. Audit and observability (target)

| Event | Sink |
|-------|------|
| Cloudflare Access login/deny | Cloudflare Zero Trust logs |
| Owner gate allow/deny | `logOwnerGateEvent` (structured) |
| Platform API calls | `platform_owner_audit_log` |
| Security denials | `recordOwnerSecurityDenial` |
| Break-glass | `platform_break_glass_grants` (existing pattern) + manual audit |

---

## 9. Non-goals (this architecture)

- Separate Worker binary for admin (same OpenNext bundle, host-based routing)
- Separate Supabase project for admin
- Tenant admin elevation paths
- ROMA test execution on admin host (future gated slice)
- DNS changes in this documentation commit

---

## 10. Success criteria

| Criterion | Measure |
|-----------|---------|
| Canonical entry | Operators bookmark `admin.aistroyka.ai` only |
| Public host clean | `/platform-admin` not reachable without redirect |
| Tenant isolation | Tenant admin 403 on admin host + platform APIs |
| Defense in depth | Access + grant + API guard all required |
| Audit complete | Every platform API write generates audit row |
| ROMA loads | Testing dashboard read-only on admin host |
