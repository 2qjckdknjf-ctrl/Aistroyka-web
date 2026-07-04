# ROMA Safe Audit Manual Refresh Report

**Date:** 2026-07-04  
**Branch:** `security/platform-admin-separation`  
**API:** `POST /api/v1/platform/testing/safe-audit/refresh`  
**UI:** `/[locale]/platform-admin/testing/safe-audit`

---

## Purpose

Allow the Platform Owner to manually refresh the Safe Readonly Audit snapshot from ROMA QA Center without full test execution, CI, deploys, or production mutation.

---

## API route

| Property | Value |
|----------|-------|
| Method | `POST` |
| Path | `/api/v1/platform/testing/safe-audit/refresh` |
| Guard | `requirePlatformOwnerApi(request, { mode: "read" })` |
| Handler | `buildSafeReadonlyAuditRefreshResponse()` → `createSafeReadonlyAudit()` |
| Persistence | None |

### Response shape

```json
{
  "data": {
    "audit": { "...RomaSafeReadonlyAudit" },
    "generatedAt": "ISO-8601",
    "mode": "SAFE_READONLY_AUDIT",
    "limitations": ["..."],
    "forbiddenActions": ["..."]
  }
}
```

---

## Security model

| Control | Enforcement |
|---------|-------------|
| Platform owner only | `requirePlatformOwnerApi` — same gate as other `/api/v1/platform/*` routes |
| No tenant admin | `/admin/*` namespace not used; page path guard excludes tenant routes |
| No public access | Session + owner grant required |
| No service bypass | Fail-closed on auth denial |
| Read mode | `mode: "read"` — no write tier required for refresh |

---

## Read-only guarantees

- Recomputes existing live probes only (`runLiveProbes` + dashboard/intelligence snapshots)
- No catalog test execution
- No Playwright / mobile simulators
- No CI / workflow dispatch
- No deploy / wrangler
- No DB inserts/updates/deletes
- No feature flag mutation
- No background jobs
- UI updates in-memory state only — no persistence

---

## Forbidden actions (unchanged)

All `ROMA_SAFE_READONLY_AUDIT_FORBIDDEN` actions remain blocked, including `ci_trigger`, `playwright_execution`, `production_mutation`, `db_writes`, `deploys`, `catalog_test_execution`.

---

## UI behavior

- **Refresh Safe Audit** button (secondary, with loading state)
- Clear copy: refreshes read-only evidence only
- Shows last refreshed timestamp
- Error state on failed refresh (401/403/network)
- Does **not** add Run Full Audit / Execute / Deploy / Fix

---

## Tests

| Test file | Coverage |
|-----------|----------|
| `roma-safe-audit-refresh.test.ts` | API guard, handler wiring, no DB/CI, UI button |
| `roma-safe-readonly-audit.test.ts` | Updated UI assertions |

---

## Limitations

1. No run history — each refresh is ephemeral
2. No rate-limit UI (relies on owner API rate limits)
3. No evidence export download
4. Page load still runs initial audit server-side; refresh is client-triggered POST
5. Catalog execution remains `executionEnabled: false`

---

## Next step: run history design

| Phase | Scope |
|-------|-------|
| **History store** | Append-only audit log table under platform-owner RLS |
| **History UI** | List prior refresh snapshots with diff |
| **Evidence export** | Owner-gated JSON download |
| **Rate limit UX** | Client-side cooldown + server 429 handling |

---

## Verdict flags

| Flag | Value |
|------|-------|
| `ROMA_SAFE_AUDIT_REFRESH_READY` | **YES** |
| `PRODUCTION_MUTATION` | **NO** |
| `READY_FOR_RUN_HISTORY_DESIGN` | **YES** |
