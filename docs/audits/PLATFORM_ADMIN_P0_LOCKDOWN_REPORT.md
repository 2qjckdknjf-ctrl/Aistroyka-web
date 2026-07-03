# Platform Admin P0 Lockdown Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Type:** Phase 0 security implementation (code + guards)

---

## Summary

Implemented minimal P0 boundary lockdown without migrating the platform admin cabinet. Dangerous platform-wide actions under tenant `/admin` now require `platform_owner_grants` at the API layer; tenant admins receive **403** with `code: platform_admin_required`. Platform-only pages redirect tenant admins to `/admin`.

---

## P0 blockers addressed

| # | Blocker | Mitigation |
|---|---------|------------|
| 1 | `POST /api/v1/admin/flags` global mutation | `requirePlatformOwnerLegacyAdminRoute` on POST only; GET unchanged for tenant override UI |
| 2 | Cross-tenant cron from tenant UI | `blockAuthenticatedNonPlatformCronCaller` on cron-tick + schedule-reconcile; UI controls removed |
| 3 | Platform billing under tenant admin | Platform owner guard on all `/api/v1/admin/billing/*`; `billing-pilot/layout.tsx` page gate |
| 4 | Platform leads CRM under tenant admin | Platform owner guard on all `/api/v1/admin/leads/*`; `leads/layout.tsx` page gate |
| 5 | `ADMIN_EMAILS` on `/admin/system` | Removed `lib/auth/admin` check; page uses tenant `admin/layout.tsx` guard only |

---

## Routes locked down

### APIs — platform owner grant required

- `POST /api/v1/admin/flags`
- `POST /api/v1/admin/jobs/cron-tick` (+ blocks authenticated non-platform sessions)
- `POST /api/v1/admin/jobs/schedule-reconcile` (+ blocks authenticated non-platform sessions)
- `GET|POST|DELETE /api/v1/admin/billing/*` (8 route files)
- `GET|PATCH /api/v1/admin/leads/*` (3 route files)

### APIs — unchanged (tenant admin)

- `GET /api/v1/admin/flags` (read keys for tenant overrides)
- `POST /api/v1/admin/tenants/[id]/flags` (tenant override)
- Tenant-scoped ops: alerts, anomalies, jobs list, operator smoke, diagnostics, etc.

### Pages — platform owner grant required

- `/[locale]/admin/billing-pilot/*` → tenant admin redirected to `/admin`
- `/[locale]/admin/leads/*` → tenant admin redirected to `/admin`

### Pages — tenant admin (fixed)

- `/[locale]/admin/system` — accessible to tenant owner/admin via layout guard (no `ADMIN_EMAILS`)

---

## UI changes

- Removed `/admin/leads` links from admin hub and Product Control Center
- Removed leads fetch/widgets from `AdminProductControlCenterClient`
- `OperatorWorkbenchClient`: removed cron secret UI, cron/reconcile buttons, leads triage, global flag create; kept tenant override + tenant ops

---

## New modules

| File | Purpose |
|------|---------|
| `lib/api/require-platform-admin-legacy-route.ts` | API guards for legacy platform routes |
| `lib/platform-owner/require-platform-owner-legacy-admin-page.ts` | Server page redirect guard |

---

## Validation

```
bun run test -- lib/api/require-platform-admin-legacy-route.test.ts \
  app/api/v1/admin/leads/route.test.ts \
  app/api/v1/admin/jobs/cron-tick/route.test.ts
```

**Result:** 16 tests passed (3 files)

---

## Remaining gaps (Phase 1+)

- Platform owners without tenant membership cannot use legacy billing/leads APIs (still require tenant context) — migrate to `/api/v1/platform/*`
- `GET /api/v1/admin/flags` still exposes global flag list to tenant admins (read-only; acceptable for tenant overrides)
- No `admin.aistroyka.ai` host separation yet
- `lib/auth/admin.ts` remains in tree but unused by `/admin/system` (deprecate in Phase 4)

---

## Verdict

**P0_LOCKDOWN_COMPLETE = YES** (for defined scope)  
**READY_FOR_PHASE1_PLATFORM_ADMIN_MIGRATION = YES**
