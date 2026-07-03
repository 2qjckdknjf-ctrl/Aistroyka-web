# Platform Admin Security Boundary Report

**Date:** 2026-07-03  
**Branch:** `feature/roma-qa-framework` @ `01706f46a416dc9d8a28bb83f7574fbe28084783`  
**Scope:** Security boundary analysis only. No code changes.

**Related:** [`PLATFORM_ADMIN_DEEP_AUDIT.md`](./PLATFORM_ADMIN_DEEP_AUDIT.md)

---

## 1. Intended boundaries (target state)

```
┌─────────────────────────────────────────────────────────────────┐
│ PUBLIC WEBSITE (aistroyka.ai)                                   │
│ Marketing, login, register — no admin surfaces linked           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ auth
┌─────────────────────────────────────────────────────────────────┐
│ TENANT DASHBOARD (aistroyka.ai /[locale]/dashboard|admin|team)  │
│ Company admin: projects, team, tenant AI ops, tenant jobs       │
│ NO global flags, NO cross-tenant cron, NO platform billing      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PLATFORM ADMIN (admin.aistroyka.ai preferred)                   │
│ platform_owner_grants only + Cloudflare Access + 2FA            │
│ Cross-tenant metadata, billing ops, global flags, ROMA, cron    │
│ NO tenant_members admin access                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM / CRON PLANE (no browser UI; secrets only)               │
│ CRON_SECRET, SYSTEM_API_KEY, OWNER_GATE_SECRET                  │
│ Invoked by platform admin backend or scheduled workers only     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Current boundary violations (P0)

### P0-1: Global feature flags writable by tenant admin

| Attribute | Detail |
|-----------|--------|
| **Surface** | `POST /api/v1/admin/flags` + Operator workbench UI |
| **Guard** | `requireAdmin(ctx, "write")` — any tenant `admin` or `owner` |
| **Impact** | Mutates global `feature_flags` via service role; affects all tenants |
| **Boundary crossed** | Tenant admin → platform configuration |
| **Remediation** | Move to `/api/v1/platform/flags`; require `platform_owner_grants` + `OWNER_OPERATOR` write |

### P0-2: Cross-tenant cron/job execution from tenant admin UI

| Attribute | Detail |
|-----------|--------|
| **Surface** | `POST /api/v1/admin/jobs/cron-tick`, `schedule-reconcile` |
| **Guard** | `requireCronSecretIfEnabled` only — **no** tenant or platform RBAC |
| **UI** | Operator workbench exposes buttons + optional `CRON_SECRET` paste field |
| **Impact** | Processes jobs for **all tenants** when secret provided |
| **Boundary crossed** | Tenant admin UI → system cron plane |
| **Remediation** | Move routes to platform API; remove from tenant UI; cron secret only in platform backend / CF Worker cron |

### P0-3: Platform billing ops under tenant admin API

| Attribute | Detail |
|-----------|--------|
| **Surface** | `/api/v1/admin/billing/*`, `/admin/billing-pilot` |
| **Guard** | `admin:write` / `admin:read` (tenant admin sufficient) |
| **Impact** | Reprocess global billing events, manage pilot cohorts — platform finance |
| **Boundary crossed** | Tenant admin → platform finance |
| **Remediation** | Move to platform admin; require `OWNER` or `OWNER_OPERATOR` |

### P0-4: Marketing leads CRM under tenant admin

| Attribute | Detail |
|-----------|--------|
| **Surface** | `/admin/leads`, `/api/v1/admin/leads/*` |
| **Guard** | Tenant admin |
| **Impact** | Platform marketing/sales data exposed to any contractor company admin |
| **Boundary crossed** | Tenant admin → platform CRM |
| **Remediation** | Move to platform admin |

### P0-5: Parallel auth model on `/admin/system`

| Attribute | Detail |
|-----------|--------|
| **Surface** | `admin/system/page.tsx` |
| **Guard** | `ADMIN_EMAILS` env allowlist (`lib/auth/admin.ts`), **not** `requireAdmin` layout |
| **Impact** | Layout allows any tenant admin; page may 403/redirect inconsistently; email allowlist bypasses RBAC matrix |
| **Boundary crossed** | Legacy platform allowlist embedded in tenant admin tree |
| **Remediation** | Deprecate `ADMIN_EMAILS`; use tenant metrics or move deep system view to platform admin |

---

## 3. High-risk issues (P1)

### P1-1: `/owner` not in auth redirect prefix list

| Detail |
|--------|
| `PROTECTED_PREFIXES` includes `/admin` but **not** `/owner` |
| Unauthenticated access → 403 plain text, not login redirect |
| Weak UX for operators; inconsistent session establishment |
| **Fix:** Platform host should require CF Access + Supabase session; redirect unauthenticated to isolated login |

### P1-2: `/admin` linked from public product nav

| Detail |
|--------|
| `Nav.tsx` shows `/admin` to all authenticated dashboard users |
| Layout guard redirects non-admins, but route is **discoverable** |
| **Fix:** Only render Admin nav item when `isAdmin=true` (already partial in `DashboardShell`; `Nav.tsx` still exposes link) |

### P1-3: Same-origin platform and tenant cabinets

| Detail |
|--------|
| `aistroyka.ai/en/owner` and `aistroyka.ai/en/admin` share cookies, CSP, attack surface |
| `OWNER_ALLOWED_HOSTS` exists but optional |
| **Fix:** Deploy platform admin on `admin.aistroyka.ai`; enforce host allowlist in production |

### P1-4: `GET /api/v1/ops/metrics` not admin-gated

| Detail |
|--------|
| Any tenant member can read ops metrics for their tenant |
| Acceptable for cockpit; sensitive aggregates should stay tenant-scoped |
| **Fix:** Optional: restrict to `admin:read` if metrics include privileged counts |

### P1-5: Cron secret paste in browser UI

| Detail |
|--------|
| Operator workbench stores `CRON_SECRET` in client state for session |
| Risk of secret leakage via XSS, screen share, browser extensions |
| **Fix:** Remove client-side cron invocation entirely from tenant admin |

### P1-6: `break-glass.service.ts` missing from branch

| Detail |
|--------|
| Architecture docs claim foundation closed; service file absent |
| Break-glass table exists but no application enforcement visible |
| **Fix:** Verify main branch; restore service under platform-admin module |

---

## 4. Boundary matrix (current vs target)

| Function | Public | Tenant member | Tenant admin | Platform owner | System secret |
|----------|--------|---------------|--------------|----------------|---------------|
| View own projects | — | ✅ | ✅ | — | — |
| Tenant AI observability | — | ❌ | ✅ | — | — |
| Tenant failed jobs | — | ❌ | ✅ | — | — |
| Global feature flags | ❌ | ❌ | ⚠️ **today** | ✅ target | — |
| Cross-tenant cron | ❌ | ❌ | ⚠️ **today** | ✅ target | ✅ |
| Billing pilot reprocess | ❌ | ❌ | ⚠️ **today** | ✅ target | — |
| Cross-tenant tenant list | ❌ | ❌ | ❌ | ✅ | — |
| Public health | ✅ | ✅ | ✅ | ✅ | — |
| System health deep | ❌ | ❌ | ❌ | ✅ target | ✅ today |
| ROMA test execution | ❌ | ❌ | ❌ | ✅ target | — |
| ROMA reports read | ❌ | ❌ | ❌ | ✅ target | — |

---

## 5. Dangerous mixing map

```
PUBLIC WEBSITE
    │
    ├── Nav.tsx ──────────────────────► /admin (discoverable)
    │
TENANT DASHBOARD (/admin)
    │
    ├── OperatorWorkbenchClient
    │       ├── POST /api/v1/admin/flags ──────────► GLOBAL feature_flags
    │       ├── POST /api/v1/admin/jobs/cron-tick ► ALL TENANTS (cron secret)
    │       └── POST /api/v1/admin/jobs/schedule-reconcile ► ALL TENANTS
    │
    ├── billing-pilot ─────────────────► /api/v1/admin/billing/*
    │
    ├── leads ─────────────────────────► platform CRM data
    │
    └── system/page.tsx ───────────────► ADMIN_EMAILS (legacy platform allowlist)

PLATFORM OWNER (/owner)  [same origin, obscure path]
    │
    └── owner-console-client ──────────► /api/v1/owner/* (well guarded)

SYSTEM PLANE
    │
    ├── /api/v1/jobs/process (cron secret)
    └── /api/v1/system/* (SYSTEM_API_KEY)
```

---

## 6. Audit logging gaps

| Action | Logged today? | Gap |
|--------|---------------|-----|
| Platform owner API calls | ✅ `insertPlatformOwnerAudit` | — |
| Owner gate denials | ✅ `logOwnerGateEvent` | — |
| Tenant admin API calls | ⚠️ Partial (`emitAudit` on some writes) | No unified platform audit for tenant admin flag/billing/cron actions |
| Cron tick execution | ⚠️ Job logs only | No owner audit row |
| Global flag changes | ⚠️ `emitAudit` on POST flags | Audit is tenant-scoped context — wrong granularity |
| Break-glass usage | ❌ No service | Table only |
| ROMA test runs | ❌ Not implemented | — |

**Target:** Every platform admin mutation → `platform_admin_audit` (extend existing owner audit) with actor, role, IP, host, payload hash.

---

## 7. Missing protections (target checklist)

| Control | Today | Target |
|---------|-------|--------|
| Separate subdomain | ❌ | `admin.aistroyka.ai` |
| Cloudflare Access / Zero Trust | ❌ (not in repo) | Required at edge |
| Mandatory 2FA for platform operators | ❌ | Supabase MFA + CF Access |
| No public nav links | ❌ `/admin` in Nav | Remove platform paths from marketing nav |
| `noindex` | ✅ owner layout | Platform cabinet all pages |
| Session timeout | ⚠️ Optional `OWNER_MAX_SESSION_*` | Enforce on platform host |
| IP allowlist | ⚠️ Optional `OWNER_IP_ALLOWLIST` | Recommended production default |
| Host allowlist | ⚠️ Optional `OWNER_ALLOWED_HOSTS` | **Required** = `admin.aistroyka.ai` |
| Owner gate secret header | ⚠️ Optional | Required for production API |
| Step-up for critical mutations | ✅ `critical/echo` pattern | Extend to billing reprocess, flag rollout |
| Tenant admin blocked from platform host | ❌ | Host middleware deny |
| CF Worker cron (no browser) | Partial | Replace UI cron triggers |

---

## 8. ROMA / testing boundary (preview)

| Risk | Assessment |
|------|------------|
| Tenant admin triggering ROMA | **Must be NO** for global suites |
| ROMA reading production PII | **Minimize** — use staging credentials + redacted fixtures |
| ROMA reports on public site | **Must be NO** |
| ROMA execution on same worker as customer dashboard | **Acceptable** if route/API gated; **prefer** platform host isolation |

Full decision: [`PLATFORM_ADMIN_ROMA_PLACEMENT_DECISION.md`](./PLATFORM_ADMIN_ROMA_PLACEMENT_DECISION.md)

---

## 9. Prioritized remediation

### P0 (before platform admin GA)

1. Lock `POST /api/v1/admin/flags` to platform owner API (feature flag off for tenant admins).
2. Remove cron-tick / schedule-reconcile from tenant operator UI; restrict to platform + cron secret.
3. Move billing pilot APIs behind platform owner guard.
4. Move leads APIs to platform owner guard.
5. Deprecate `ADMIN_EMAILS` gate on `/admin/system`.

### P1 (during restructure)

6. Enforce `OWNER_ALLOWED_HOSTS=admin.aistroyka.ai` in production.
7. Remove `/admin` from `Nav.tsx` for non-admins; never link `/owner` or platform host.
8. Add middleware host routing for platform admin subdomain.
9. Restore break-glass service + platform audit for grant usage.

### P2 (hardening)

10. Cloudflare Access on `admin.aistroyka.ai`.
11. Unified platform audit stream.
12. ROMA read-only reports on platform host.

---

## 10. Verdict

**ADMIN_SEPARATION_REQUIRED = YES**

The current model mixes tenant company administration with platform-wide system operations on the same host, same `/api/v1/admin` namespace, and discoverable UI paths. Separation is a **security requirement**, not a cosmetic refactor.
