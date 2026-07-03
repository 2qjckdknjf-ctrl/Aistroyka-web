# Platform Admin Phase 1 Migration Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Scope:** Phase 1 platform admin cabinet migration (no ROMA UI)

## Summary

Phase 1 introduces a dedicated **platform admin cabinet** at `/[locale]/platform-admin`, a canonical **`/api/v1/platform/*`** API namespace, and deprecation aliases for legacy `/owner` and tenant-admin platform routes. P0 lockdown behavior is preserved: tenant company admins cannot reach platform billing/leads APIs or legacy platform pages under `/admin/*`.

## What changed

### UI route group

| Surface | Path | Guard |
|--------|------|-------|
| Platform admin (canonical) | `/[locale]/platform-admin` | `gateOwnerRequest` + `assertPlatformOwnerPageAccess` |
| Platform admin billing | `/[locale]/platform-admin/billing` | same |
| Platform admin leads | `/[locale]/platform-admin/leads` | same |
| Tenant company admin | `/[locale]/admin/*` | tenant owner/admin membership |
| Legacy owner (alias) | `/[locale]/owner` | redirects → `/platform-admin` |
| Legacy tenant-admin platform pages | `/admin/billing-pilot`, `/admin/leads` | tenant admin → `/admin`; platform owner → redirect to platform-admin |

Navigation separation is implemented via `PlatformAdminShell` (Overview · Billing pilot · Contact leads) with explicit “not tenant company admin” labeling.

### API namespaces

| Namespace | Role | Notes |
|-----------|------|-------|
| `/api/v1/platform/*` | **Canonical** | Owner console, billing pilot, leads |
| `/api/v1/owner/*` | Deprecated alias | Delegates to platform; `Deprecation: true` |
| `/api/v1/admin/billing/*` | Deprecated alias | Delegates to platform; `Deprecation: true` |
| `/api/v1/admin/leads/*` | Deprecated alias | Delegates to platform; `Deprecation: true` |

Platform billing/leads handlers now use `requirePlatformOwnerApi` only (no tenant context / `requireAdmin`).

### Middleware & Workers

- Page gate: `isPlatformAdminPagePath` covers `/owner` and `/platform-admin`.
- API gate: `isPlatformAdminApiPath` covers `/api/v1/owner` and `/api/v1/platform`.
- Cloudflare worker bypass patch updated: middleware runs for both owner and platform API paths.

### Preferred host

- Documented preferred host: `admin.aistroyka.ai` (`PLATFORM_ADMIN_PREFERRED_HOST`).
- Host enforcement remains optional via `OWNER_ALLOWED_HOSTS` (same policy as owner gate).
- App routes work on primary domain as `/[locale]/platform-admin` fallback.

## Validation matrix

| Check | Result |
|-------|--------|
| Tenant admin cannot access platform admin pages | **PASS** — `gateOwnerRequest` denies without `platform_owner_grants` |
| Tenant admin cannot access platform billing/leads APIs | **PASS** — `requirePlatformOwnerApi` / owner gate |
| Tenant admin `/admin` remains tenant-scoped | **PASS** — hub unchanged; billing/leads redirect away or layout blocks |
| Platform owner can access platform admin | **PASS** — grant + owner middleware |
| Platform billing/leads no longer primary under tenant admin | **PASS** — pages redirect; APIs deprecated |
| `/api/v1/owner/*` aliases still work | **PASS** — delegate + deprecation headers |
| P0 lockdown preserved | **PASS** — flags/cron/global surfaces unchanged |

## Tests

Added/updated:

- `lib/platform-admin/middleware-paths.test.ts`
- `lib/platform-admin/deprecation.test.ts`
- `lib/platform-admin/legacy-owner-api.test.ts`
- Updated admin billing/leads alias route tests for platform delegation mocks

Run:

```bash
cd apps/web && bun run test -- lib/platform-admin app/api/v1/admin/billing app/api/v1/admin/leads lib/api/require-platform-admin-legacy-route.test.ts
```

## Files of note

- `apps/web/lib/platform-admin/*` — constants, middleware paths, deprecation, aliases
- `apps/web/app/[locale]/(platform-admin)/platform-admin/*` — new cabinet pages
- `apps/web/components/platform-admin/*` — shell + clients (`/api/v1/platform/*`)
- `apps/web/app/api/v1/platform/*` — canonical platform APIs
- `apps/web/middleware.ts` — unified platform-admin page/API gating

## Out of scope (Phase 1)

- ROMA readonly UI
- DNS / Cloudflare route for `admin.aistroyka.ai` (host policy helpers only)
- Removal of `/owner` or `/api/v1/admin/billing|leads` aliases

## Final verdicts

| Verdict | Value |
|---------|-------|
| `PHASE1_PLATFORM_ADMIN_MIGRATION` | **YES** |
| `ADMIN_HOST_READY` | **PARTIAL** — route model + host policy ready; DNS/Worker host routing not deployed |
| `READY_FOR_ROMA_READONLY_TESTING_PAGE` | **YES** — isolated platform-admin surface exists; ROMA can mount read-only under `/platform-admin` without touching tenant `/admin` |
