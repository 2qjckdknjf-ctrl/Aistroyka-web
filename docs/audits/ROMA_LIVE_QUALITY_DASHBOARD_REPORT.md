# ROMA Live Quality Dashboard Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Scope:** Live read-only quality control center at `/[locale]/platform-admin/testing`

---

## Summary

Transformed the static ROMA read-only page into a **live quality dashboard** that aggregates real platform probes at request time. No test execution, no CI orchestration, no action buttons. Missing data surfaces as **Unknown**, **Not Available**, or **Not Configured** — never fabricated metrics.

---

## Route

| Route | API |
|-------|-----|
| `/[locale]/platform-admin/testing` | `GET /api/v1/platform/testing/quality` (platform owner, read-only) |

Both use existing `assertPlatformOwnerPageAccess` / `requirePlatformOwnerApi` guards.

---

## Files changed

| File | Purpose |
|------|---------|
| `apps/web/lib/platform-admin/roma-quality-dashboard.types.ts` | Dashboard data model |
| `apps/web/lib/platform-admin/roma-quality-dashboard.service.ts` | Live aggregation service |
| `apps/web/lib/platform-admin/roma-quality-dashboard.service.test.ts` | Service unit tests |
| `apps/web/lib/platform-admin/roma-quality-dashboard.page.test.ts` | Page/nav/security tests |
| `apps/web/lib/platform-admin/quality-dashboard-ui.ts` | Badge/format helpers |
| `apps/web/app/api/v1/platform/testing/quality/route.ts` | Read-only quality API |
| `apps/web/app/[locale]/(platform-admin)/platform-admin/testing/page.tsx` | Server page (live fetch) |
| `apps/web/components/platform-admin/PlatformAdminTestingClient.tsx` | Dashboard UI |
| `apps/web/lib/platform-admin/testing-readonly-snapshot.ts` | Removed (superseded by live service) |

---

## Available live sources

| Source | Used for |
|--------|----------|
| `getHealthResponse()` | Overall health, DB, AI config, build stamp |
| `getSystemHealth()` | AI brain, copilot, alerts, workflows |
| `validateReleaseEnv()` | Security readiness, env blockers |
| `getBillingAdapterDiagnostics()` | Billing/adapter readiness |
| `getAdminClient()` + `storage.listBuckets()` | Storage probe (when service role present) |
| `getBuildStamp()` / deploy env | Latest commit, deploy time, branch |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_ENV` | Environment label |
| Mobile store URL env vars | iOS/Android distribution hints |

---

## Unavailable sources (explicitly listed on page)

- Cloudflare Workers live API status
- CI pipeline / test run history
- Mobile store build / TestFlight live probes
- Performance telemetry (Lighthouse / RUM)
- Database migration version probe
- ROMA learning loop telemetry
- Runtime filesystem doc index

---

## Security model

- Platform owner only (layout + middleware + API guard).
- Read-only: no Run / Execute / Deploy / Fix / Restart / Delete controls.
- `testExecutionEnabled: false` in data model.
- Tenant `/admin` unchanged.

---

## Validation

```bash
cd apps/web && bun run test -- \
  lib/platform-admin/roma-quality-dashboard.service.test.ts \
  lib/platform-admin/roma-quality-dashboard.page.test.ts \
  lib/platform-admin/middleware-paths.test.ts
```

---

## Limitations

- Dashboard reflects **current runtime** at page load (no auto-refresh).
- Performance category always **Unknown** until a live telemetry source is wired.
- Known reports show repo paths only (no in-app doc viewer routes).
- `admin.aistroyka.ai` host deployment status inferred from `OWNER_ALLOWED_HOSTS` absence.

---

## Next phase

- Optional auto-refresh via `GET /api/v1/platform/testing/quality` polling.
- Wire performance/RUM source when available.
- Gated **Safe Audit** button design (read-only report export) — not enabled in this slice.

---

## Verdicts

| Verdict | Value |
|---------|-------|
| `ROMA_LIVE_DASHBOARD` | **YES** |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_SAFE_AUDIT_BUTTON` | **YES** (live read model exists; audit export is next gated slice) |
