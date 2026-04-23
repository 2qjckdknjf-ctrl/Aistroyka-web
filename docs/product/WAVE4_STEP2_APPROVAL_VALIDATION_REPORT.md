# Wave 4 Step 2 — Validation (Stage G)

**Run date:** 2026-03-28

## Tests

- **Command:** `npm run test` (repo root → `apps/web` Vitest).
- **Result:** **PASS** — 185 files, 1131 tests.

### Focused coverage

| Area | File |
|------|------|
| Approval event insert + project count | `lib/domain/reports/report-approval.repository.test.ts` |
| Resubmit + event insert mock | `lib/domain/reports/report.repository.resubmit.test.ts` |
| Summary attention for pending approvals | `lib/domain/projects/project-status.service.test.ts` |
| Assembler summary shape | `project-truth-snapshot.assembler.test.ts` |

## Production build

- **Command:** `npm run build`
- **Result:** **PASS** (Next.js 15.5.12, typecheck + lint).

## Deploy note

- Apply **`20260328180000_report_approval_events.sql`** to Supabase before production use of approval history inserts.
