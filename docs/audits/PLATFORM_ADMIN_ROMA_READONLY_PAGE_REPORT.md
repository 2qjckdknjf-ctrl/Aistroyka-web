# Platform Admin ROMA Read-Only Page Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Scope:** Read-only ROMA / testing center at `/[locale]/platform-admin/testing`

---

## Summary

Added a **read-only** platform testing center inside the isolated Platform Admin Cabinet. The page shows testing/ROMA readiness, security status, evidence report references, blockers, and next safe action using a **static snapshot** — no test execution, no CI calls, no filesystem reads at runtime.

---

## Route added

| Route | Guard |
|-------|-------|
| `/[locale]/platform-admin/testing` | `(platform-admin)/platform-admin/layout.tsx` → `assertPlatformOwnerPageAccess` + middleware `gateOwnerRequest` |

Preferred future host: `admin.aistroyka.ai` (not deployed). Current fallback: locale-prefixed `/platform-admin/testing` on primary domain.

---

## Files changed

| File | Purpose |
|------|---------|
| `apps/web/app/[locale]/(platform-admin)/platform-admin/testing/page.tsx` | Server page entry |
| `apps/web/components/platform-admin/PlatformAdminTestingClient.tsx` | Read-only UI (cards, no buttons) |
| `apps/web/components/platform-admin/PlatformAdminShell.tsx` | Nav uses shared shell-nav |
| `apps/web/lib/platform-admin/shell-nav.ts` | Shared nav items incl. ROMA Testing |
| `apps/web/lib/platform-admin/testing-readonly-snapshot.ts` | Static data model |
| `apps/web/lib/platform-admin/testing-readonly-page.test.ts` | Focused tests |
| `apps/web/lib/platform-admin/middleware-paths.test.ts` | `/platform-admin/testing` path case |

---

## Security model

- Page lives under existing `(platform-admin)` route group — same layout guard as overview/billing/leads.
- Middleware: `isPlatformAdminPagePath("/platform-admin/testing")` → `gateOwnerRequest` (platform owner grant required).
- **No** new auth model; **no** tenant `/admin` changes; **no** execution API routes added.
- Tenant admins: blocked by existing platform owner gate (403 / redirect patterns unchanged).

---

## Data model

`PLATFORM_ADMIN_TESTING_READONLY_SNAPSHOT` (`testing-readonly-snapshot.ts`):

- `pageMode: "read_only"`, `testExecutionEnabled: false`
- Status cards: overall testing, platform admin security, ROMA framework, release readiness
- Evidence refs (paths only): P0, Phase 1, post-audit, no-tail audit, ROMA merge tracker, Stage 2C review
- Known blockers + next safe action (static strings)

No secrets, no `fetch`, no script execution, no dependency on uncommitted `docs/qa/`.

---

## UX copy

Page explicitly states:

- Read-only; test execution from UI not enabled
- ROMA cannot mutate production from this surface
- Tenant admins cannot access platform testing
- `admin.aistroyka.ai` host pending deployment

---

## Limitations (by design)

- No Run / Execute / Start test controls
- No `/api/v1/platform/testing/*` endpoints
- No live CI status or dynamic report ingestion
- Evidence section lists doc paths only (not live links to repo browser)

---

## Validation evidence

```bash
cd apps/web && bun run test -- lib/platform-admin/testing-readonly-page.test.ts lib/platform-admin/middleware-paths.test.ts
```

Checks:

- ROMA Testing in shell nav
- `testExecutionEnabled === false`
- `/platform-admin/testing` is platform-admin page path (tenant `/admin/testing` is not)
- Testing client source: no `fetch`, no `<button`, no execution CTA strings

---

## Next phase

1. Merge this branch via protected PR after CI.
2. Design ROMA execution: `GET /api/v1/platform/testing/reports` (read) before any gated `POST .../run`.
3. Deploy `admin.aistroyka.ai` when DNS/Worker routing ready.
4. Wire dynamic report ingestion from versioned `docs/qa/` artifacts (after QA scaffold is intentionally merged).

---

## Verdicts

| Verdict | Value |
|---------|-------|
| `ROMA_READONLY_PAGE_ADDED` | **YES** |
| `TENANT_ADMIN_ACCESS_BLOCKED` | **YES** (existing platform owner guard) |
| `TEST_EXECUTION_ENABLED` | **NO** |
| `READY_FOR_ROMA_EXECUTION_DESIGN` | **YES** (read-only surface landed; execution is separate gated phase) |
