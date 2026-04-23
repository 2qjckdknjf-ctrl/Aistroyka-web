# Wave 4 Step 9 — Validation & post-audit

## Validation (G)

- **Tests:** `lib/domain/projects/stakeholder-activity-timeline.repository.test.ts` (`shapeStakeholderAudience`).
- **Build:** `npm run build` at repo root (passed for Step 9 closure).
- **Focused checks:** Typecheck/lint on new route and components.

## Post-audit (H)

| Area | Status |
|------|--------|
| Read model backed by real tables | **FULL** |
| Manager timeline surface | **FULL** |
| Stakeholder timeline surface | **FULL** |
| Internal-only leakage | **FULL** (shaping + RLS) |
| Validation | **PARTIAL** (unit test only; no HTTP integration test) |

**Open P1:** Add route-level tests with mocked Supabase for `GET /stakeholder-activity` role branching.

**Step closed:** **YES** — timeline is read-model backed, both audiences have UI, and shaping excludes internal rows from stakeholder JSON.
