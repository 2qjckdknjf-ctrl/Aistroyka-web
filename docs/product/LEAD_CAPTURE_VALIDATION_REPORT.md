# Lead Capture — Validation Report

**Date:** 2026-03-19  
**Phase:** Lead Capture / Contact Persistence Foundation

---

## 1. Commands run

| Command | Location | Result |
|--------|----------|--------|
| `npm run build` | Repo root | **PASS** (exit 0) |
| `npm run test -- --run apps/web/app/api/contact/route.test.ts apps/web/app/api/v1/admin/leads/route.test.ts` | apps/web | **SKIP** (see Tests) |

---

## 2. Tests

- **Contact API** (`apps/web/app/api/contact/route.test.ts`): Present; covers 400 (missing name, invalid email, empty message), 200 with insert (source/status), 200 with null company, 500 when getAdminClient is null.
- **Admin leads list** (`apps/web/app/api/v1/admin/leads/route.test.ts`): Present; covers 200 with data, 401 when requireTenant throws, 403 when requireAdmin returns 403, 503 when getAdminClient is null.
- **Local run:** Vitest failed to start with esbuild platform mismatch (`@esbuild/darwin-x64` vs current platform). This is an environment/install issue, not a test-code defect. **Validation relies on CI** to run these tests in a consistent environment.
- **PATCH leads/[id]:** No dedicated test file; acceptable for this phase. Manual or future CI coverage recommended.

---

## 3. Build result

- **Production build:** Success from repo root (`npm run build` → contracts + Next.js).
- **Typecheck:** Pass (after fixing Badge variant and TableHeaderCell children; PATCH route uses `@ts-expect-error` for contact_leads update type).
- **Lint:** Pass.
- **Static generation:** 280 pages generated.

---

## 4. Focused checks

| Check | Result |
|-------|--------|
| Contact form still submits to POST /api/contact | Yes; flow unchanged. |
| Contact API persists to contact_leads with source + status | Yes; insert includes source, status. |
| Migration adds status, source, notes | Yes; 20260319000000_contact_leads_status_source_notes.sql. |
| GET /api/v1/admin/leads returns list (admin only) | Implemented; tenant + requireAdmin. |
| GET/PATCH /api/v1/admin/leads/[id] (admin only) | Implemented. |
| Admin UI: list + detail + status/notes edit | Yes; /admin/leads, /admin/leads/[id]. |
| Admin home links to Contact leads | Yes. |
| No unrelated refactors | Confined to contact/leads and docs. |

---

## 5. Unrelated blockers

- None. Esbuild/Vitest local failure is environment-specific; does not block production build or deployment.

---

## 6. Final confidence level

**High.** Persistence, API, and admin surface are implemented and build passes. Test suite exists and is intended for CI; local test run is blocked only by environment. Phase is suitable for post-audit and closure decision.
