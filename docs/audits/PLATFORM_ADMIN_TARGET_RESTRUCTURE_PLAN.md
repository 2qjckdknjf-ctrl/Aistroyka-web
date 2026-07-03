# Platform Admin Target Restructure Plan

**Date:** 2026-07-03  
**Branch:** `feature/roma-qa-framework` @ `01706f46a416dc9d8a28bb83f7574fbe28084783`  
**Status:** Plan only — **do not implement** until P0 security blockers are approved.

**Related:**
- [`PLATFORM_ADMIN_DEEP_AUDIT.md`](./PLATFORM_ADMIN_DEEP_AUDIT.md)
- [`PLATFORM_ADMIN_SECURITY_BOUNDARY_REPORT.md`](./PLATFORM_ADMIN_SECURITY_BOUNDARY_REPORT.md)
- [`PLATFORM_ADMIN_ROMA_PLACEMENT_DECISION.md`](./PLATFORM_ADMIN_ROMA_PLACEMENT_DECISION.md)

---

## 1. Target admin model

### 1.1 Platform Admin Cabinet (new canonical surface)

| Attribute | Value |
|-----------|-------|
| **Preferred URL** | `https://admin.aistroyka.ai` |
| **Fallback URL** | `https://aistroyka.ai/platform-admin` (redirect to preferred when DNS ready) |
| **Audience** | `platform_owner_grants` only (`OWNER`, `OWNER_OPERATOR`, `OWNER_READONLY`) |
| **Edge** | Cloudflare Access + Zero Trust (recommended) |
| **Auth** | Supabase session + existing owner gate stack |
| **2FA** | Mandatory for `OWNER` and `OWNER_OPERATOR` (Supabase MFA + CF Access policy) |
| **Indexing** | `noindex, nofollow` all pages |
| **Public links** | None from marketing site or tenant dashboard |
| **Session** | Enforce `OWNER_MAX_SESSION_IAT_AGE_MINUTES` (suggest 60) |
| **Audit** | Every read/write API → `platform_owner_audit` row |

### 1.2 Tenant Admin Cabinet (renamed scope)

| Attribute | Value |
|-----------|-------|
| **URL** | `https://aistroyka.ai/[locale]/admin/*` (unchanged path) |
| **Display name** | "Company admin" / «Админ компании» (i18n) |
| **Audience** | `tenant_members.role` ∈ `{owner, admin}` |
| **Scope** | Single-tenant ops only |
| **Explicitly excluded** | Global flags, cross-tenant cron, billing pilot, leads CRM, ROMA execution |

---

## 2. Hosting & routing architecture

### 2.1 Recommended: single Worker, host-based routing

AISTROYKA production already uses one Cloudflare Worker per env (`aistroyka-web-production`). Add route:

```
admin.aistroyka.ai/*  →  same Worker
```

**Middleware additions (planned):**

```typescript
// Pseudocode — not implemented
const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
const isPlatformAdminHost = host === "admin.aistroyka.ai";
const isPlatformAdminPath = pathWithoutLoc.startsWith("/platform-admin");

if (isPlatformAdminHost || isPlatformAdminPath) {
  // Route group: platform-admin layout
  // Deny unless platform_owner_grants
  // Deny tenant-only /admin paths on this host
}
```

**Environment:**

```
OWNER_ALLOWED_HOSTS=admin.aistroyka.ai
NEXT_PUBLIC_PLATFORM_ADMIN_URL=https://admin.aistroyka.ai
```

### 2.2 Cloudflare Access (edge layer)

| Setting | Recommendation |
|---------|----------------|
| Application | `admin.aistroyka.ai` |
| Policy | Email domain + explicit operator list |
| MFA | Required |
| Bypass | None for production |
| Service tokens | For CI/ROMA worker → platform API only |

### 2.3 Fallback path prefix

If subdomain DNS is delayed:

| Legacy | Temporary | Final |
|--------|-----------|-------|
| `/[locale]/owner` | `/[locale]/platform-admin` | `admin.aistroyka.ai/` |
| `/api/v1/owner/*` | keep alias | `/api/v1/platform/*` primary |

---

## 3. Route map (target)

### 3.1 Platform Admin UI routes (new tree)

Proposed App Router group: `apps/web/app/[locale]/(platform-admin)/`

| Target path (host root) | Source (today) | Action |
|-------------------------|----------------|--------|
| `/` | `(owner)/owner/page.tsx` | Move + expand |
| `/tenants` | new (uses `GET /api/v1/owner/tenants`) | New sub-route |
| `/tenants/[id]` | new (uses `tenants/[tenantId]` API) | New sub-route |
| `/users` | split from owner console | New sub-route |
| `/support` | split from owner console | New sub-route |
| `/billing` | `admin/billing-pilot/*` | Move |
| `/leads` | `admin/leads/*` | Move |
| `/flags` | operator flags UI | Extract new page |
| `/jobs/system` | cron/reconcile controls | New (platform only) |
| `/audit` | owner audit tail | New sub-route |
| `/diagnostics` | owner diagnostics + system health | New sub-route |
| `/testing` | new ROMA read-only | New (phase 2) |
| `/break-glass` | new | New (phase 3) |

### 3.2 Tenant Admin UI routes (remaining)

| Path | Action |
|------|--------|
| `/admin` | Keep — simplify hub (remove platform links) |
| `/admin/governance` | Keep |
| `/admin/trust` | Keep |
| `/admin/ai/*` | Keep |
| `/admin/jobs` | Keep |
| `/admin/push` | Keep |
| `/admin/operator` | Keep — **strip** global flags, cron, leads |
| `/admin/billing-pilot` | **Remove** → redirect to platform URL |
| `/admin/leads` | **Remove** → redirect to platform URL |
| `/admin/system` | **Deprecate** or merge into tenant AI observability |

### 3.3 Legacy redirects (301, 6-month sunset)

| From | To |
|------|-----|
| `aistroyka.ai/*/owner` | `admin.aistroyka.ai/` |
| `aistroyka.ai/*/admin/billing-pilot` | `admin.aistroyka.ai/billing` |
| `aistroyka.ai/*/admin/leads` | `admin.aistroyka.ai/leads` |

---

## 4. API restructure

### 4.1 New namespace: `/api/v1/platform/*`

Primary home for platform owner APIs (rename from `/api/v1/owner/*`).

| New path | Old path | Guard |
|----------|----------|-------|
| `GET /api/v1/platform/overview` | `/api/v1/owner/overview` | platform read |
| `GET /api/v1/platform/tenants` | `/api/v1/owner/tenants` | platform read |
| `GET /api/v1/platform/tenants/[id]` | `/api/v1/owner/tenants/[id]` | platform read |
| `GET /api/v1/platform/users` | `/api/v1/owner/users` | platform read |
| `GET /api/v1/platform/audit` | `/api/v1/owner/audit` | platform read |
| `GET /api/v1/platform/diagnostics` | `/api/v1/owner/diagnostics` | platform read |
| `GET /api/v1/platform/health` | `/api/v1/owner/health` | platform read |
| `*/support/tickets/*` | `/api/v1/owner/support/*` | platform read/write |
| `POST /api/v1/platform/critical/*` | `/api/v1/owner/critical/*` | critical step-up |
| `GET/POST /api/v1/platform/flags` | `/api/v1/admin/flags` | platform write |
| `POST /api/v1/platform/jobs/cron-tick` | `/api/v1/admin/jobs/cron-tick` | cron + platform |
| `POST /api/v1/platform/jobs/schedule-reconcile` | `/api/v1/admin/jobs/schedule-reconcile` | cron + platform |
| `*/billing/*` | `/api/v1/admin/billing/*` | platform write |
| `*/leads/*` | `/api/v1/admin/leads/*` | platform read/write |
| `GET /api/v1/platform/system/health` | proxy to internal system health | platform read |
| `GET /api/v1/platform/testing/reports` | new | platform read (ROMA phase 2) |
| `POST /api/v1/platform/testing/run` | new | platform write (ROMA phase 3) |

**Alias period:** `/api/v1/owner/*` → delegate to platform handlers (deprecate header `Deprecation: true`).

### 4.2 Tenant admin APIs (unchanged namespace, reduced scope)

Keep `/api/v1/admin/*` for tenant-scoped endpoints only (22 routes per deep audit).

**Remove from `/api/v1/admin` after migration:**

- `flags` (global)
- `billing/*`
- `leads/*`
- `jobs/cron-tick`
- `jobs/schedule-reconcile`

### 4.3 Middleware matcher update (planned)

```
/api/v1/platform/*  → gateOwnerRequest (renamed)
/api/v1/owner/*     → alias (same gate)
/api/v1/admin/*     → no platform gate (tenant requireAdmin only)
```

---

## 5. File plan

### 5.1 Files to MOVE (implementation phase)

#### UI — from `(owner)` → `(platform-admin)`

```
apps/web/app/[locale]/(owner)/layout.tsx
  → apps/web/app/[locale]/(platform-admin)/layout.tsx

apps/web/app/[locale]/(owner)/owner/page.tsx
  → apps/web/app/[locale]/(platform-admin)/page.tsx

apps/web/app/[locale]/(owner)/owner/owner-console-client.tsx
  → apps/web/app/[locale]/(platform-admin)/platform-console-client.tsx
     (split into sub-pages over time)
```

#### UI — from `(dashboard)/admin` → `(platform-admin)`

```
apps/web/app/[locale]/(dashboard)/admin/billing-pilot/**
  → apps/web/app/[locale]/(platform-admin)/billing/**

apps/web/app/[locale]/(dashboard)/admin/leads/**
  → apps/web/app/[locale]/(platform-admin)/leads/**
```

#### UI — extract from operator workbench

```
OperatorWorkbenchClient.tsx (sections: flags, cron, leads)
  → apps/web/app/[locale]/(platform-admin)/flags/platform-flags-client.tsx
  → apps/web/app/[locale]/(platform-admin)/jobs/system-jobs-client.tsx
  → (leads already moving)
```

#### API — move route files

```
apps/web/app/api/v1/owner/**/*
  → apps/web/app/api/v1/platform/**/*
     (keep owner/** as thin re-export aliases during deprecation)

apps/web/app/api/v1/admin/billing/**/*
  → apps/web/app/api/v1/platform/billing/**/*

apps/web/app/api/v1/admin/leads/**/*
  → apps/web/app/api/v1/platform/leads/**/*

apps/web/app/api/v1/admin/flags/route.ts
  → apps/web/app/api/v1/platform/flags/route.ts

apps/web/app/api/v1/admin/jobs/cron-tick/route.ts
  → apps/web/app/api/v1/platform/jobs/cron-tick/route.ts

apps/web/app/api/v1/admin/jobs/schedule-reconcile/route.ts
  → apps/web/app/api/v1/platform/jobs/schedule-reconcile/route.ts
```

#### Libraries — rename package (optional, phase 2)

```
apps/web/lib/platform-owner/**/*
  → apps/web/lib/platform-admin/**/*
     (re-export from platform-owner for backward compat)
```

### 5.2 Files to KEEP in place

```
apps/web/app/[locale]/(dashboard)/admin/layout.tsx
apps/web/app/[locale]/(dashboard)/admin/page.tsx
apps/web/app/[locale]/(dashboard)/admin/governance/**
apps/web/app/[locale]/(dashboard)/admin/trust/**
apps/web/app/[locale]/(dashboard)/admin/ai/**
apps/web/app/[locale]/(dashboard)/admin/jobs/**  (tenant queue UI)
apps/web/app/[locale]/(dashboard)/admin/push/**
apps/web/app/[locale]/(dashboard)/admin/operator/**  (after strip)
apps/web/src/features/admin/**  (tenant AI features)
apps/web/lib/api/require-admin.ts
apps/web/src/features/admin/auth/requireAdmin.ts
apps/web/lib/tenant/tenant.policy.ts
```

### 5.3 Files to REMOVE LATER (post-alias period, ≥6 months)

```
apps/web/app/[locale]/(owner)/**           (after redirect verified)
apps/web/app/api/v1/owner/**               (alias handlers only)
apps/web/lib/auth/admin.ts                (ADMIN_EMAILS deprecated)
apps/web/app/[locale]/(dashboard)/admin/billing-pilot/**  (after move)
apps/web/app/[locale]/(dashboard)/admin/leads/**          (after move)
apps/web/app/api/v1/admin/flags/route.ts                  (after move)
apps/web/app/api/v1/admin/billing/**                      (after move)
apps/web/app/api/v1/admin/leads/**                        (after move)
apps/web/app/api/v1/admin/jobs/cron-tick/route.ts         (after move)
apps/web/app/api/v1/admin/jobs/schedule-reconcile/route.ts (after move)
```

### 5.4 Files that are DUPLICATE / DEAD (review before delete)

| File | Issue |
|------|-------|
| `lib/auth/admin.ts` | Duplicates tenant `requireAdmin` with email allowlist |
| `app/api/health/route.ts` | Legacy duplicate of v1 |
| `app/api/system/health/route.ts` | Duplicate of v1/system |
| `break-glass.service.ts` | Missing from branch — restore, don't delete |

---

## 6. Guards to add (implementation checklist)

| Guard | Where | Purpose |
|-------|-------|---------|
| Host check `admin.aistroyka.ai` | middleware | Platform admin surface isolation |
| Deny `/admin` on platform host | middleware | Prevent tenant admin on platform subdomain |
| Deny tenant admins on `/api/v1/platform/*` | API handler | Even if they guess URL |
| `requirePlatformOwnerApi` on moved routes | platform APIs | Existing stack |
| Cron routes: platform role + cron secret | platform jobs API | Defense in depth |
| Global flags: `OWNER_OPERATOR` write minimum | platform flags API | Tiered roles |
| Billing reprocess: `OWNER` or step-up | platform billing API | Critical finance |
| Remove `CRON_SECRET` from client UI | tenant operator | Eliminate browser secret |
| `Nav.tsx` conditional admin link | only `isAdmin` | Reduce discovery |
| Cloudflare Access | DNS edge | Zero Trust |

---

## 7. Navigation rebuild

### 7.1 Tenant dashboard (`DashboardShell`)

**Company admin section (expanded):**

- Overview → `/admin`
- AI observability → `/admin/ai`
- Governance → `/admin/governance`
- Trust → `/admin/trust`
- Jobs → `/admin/jobs`
- Push → `/admin/push`
- Operator → `/admin/operator` (tenant ops only)

**Remove:** billing-pilot, leads links.

### 7.2 Platform admin (`PlatformAdminShell` — new)

**Sidebar sections:**

- Overview
- Tenants
- Users
- Support
- Billing ops
- Leads
- Feature flags
- System jobs
- Diagnostics
- Audit log
- Testing / ROMA (phase 2)

**No** link to tenant dashboard except explicit "open tenant as support" break-glass flow (future).

### 7.3 Public `Nav.tsx`

- Remove unconditional `/admin` link
- Show only when user is tenant admin (prop from layout) OR remove entirely (admin only via sidebar)

---

## 8. Implementation phases

### Phase 0 — P0 lockdown (no file moves)

1. Add server-side deny on global flag POST for non-platform grants.
2. Return 403 on cron routes when request originates from tenant admin session without platform grant.
3. Add `Deprecation` warnings on dangerous tenant admin APIs.

**Exit:** Security boundary report P0 items mitigated.

### Phase 1 — Platform host + aliases

1. DNS `admin.aistroyka.ai` → production Worker.
2. Create `(platform-admin)` route group; move owner console.
3. Add `/api/v1/platform/*` with owner API aliases.
4. `OWNER_ALLOWED_HOSTS` enforced.

### Phase 2 — Migrate dangerous surfaces

1. Move billing-pilot, leads, flags, cron UI/API.
2. Strip operator workbench.
3. Legacy redirects from old paths.

### Phase 3 — ROMA read-only + break-glass

1. `/testing` reports viewer.
2. Restore break-glass service + UI.

### Phase 4 — Deprecation cleanup

1. Remove `(owner)` route group.
2. Remove `/api/v1/owner` aliases.
3. Remove `ADMIN_EMAILS`.

---

## 9. Testing strategy (for restructure itself)

| Test | Type |
|------|------|
| Tenant admin cannot POST global flags | API integration |
| Tenant admin cannot call platform APIs | API integration |
| Platform operator cannot access `/admin` on main host without tenant role | E2E |
| `admin.aistroyka.ai` requires owner grant | E2E |
| Legacy `/owner` redirects | E2E |
| Cron routes reject missing secret | API |
| Owner audit row on every platform mutation | API |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Breaking pilot operators using `/admin/billing-pilot` | Redirect + comms; platform host first |
| CF Worker route misconfiguration | Staging host `admin.staging.aistroyka.ai` first |
| Session cookie shared across subdomains | Scope Supabase cookie to parent domain carefully; prefer CF Access session |
| OpenNext middleware manifest issues | Follow existing `OWNER_API_MIDDLEWARE_EXCEPTION_PATH` pattern |
| Long alias period maintains confusion | Deprecation headers + logs |

---

## 11. READY_FOR_IMPLEMENTATION

**Plan ready:** YES  
**Safe to start coding:** NO — complete Phase 0 P0 lockdown first and confirm DNS/CF Access with owner.
