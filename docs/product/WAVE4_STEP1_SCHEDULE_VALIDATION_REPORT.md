# Wave 4 Step 1 — Validation (Stage G)

**Run date:** 2026-03-28

## Automated tests

- **Command:** `npm run test` (repo root → `apps/web` Vitest).
- **Result:** **PASS** — 184 files, 1127 tests.

### Focused coverage

| Area | Tests |
|------|--------|
| Schedule signal math | `lib/domain/milestones/milestone.schedule.test.ts` |
| Project status + overdue attention | `lib/domain/projects/project-status.service.test.ts` (extended) |
| Milestone repository guard | `milestone.repository.test.ts` |
| AI milestone pressure | `milestone-pressure.service.test.ts` |
| Truth snapshot + summary | `project-truth-snapshot.assembler.test.ts` |

## Production build

- **Command:** `npm run build` (contracts `tsc` + `next build`).
- **Result:** **PASS** (Next.js 15.5.12, typecheck + lint phase succeeded).

## Contracts package

- Built as part of `npm run build`; **no** `@aistroyka/contracts` API change required for milestones (REST JSON only).

## Manual / staging checks (recommended)

- Apply **`20260328120000_wave4_milestone_status.sql`** on staging Supabase, then smoke: create milestone, link task, verify GET list shows signals and summary overdue count.

## Not run in CI here

- E2E browser (Playwright/Maestro) against live env — optional follow-up for milestone PATCH + task link.
