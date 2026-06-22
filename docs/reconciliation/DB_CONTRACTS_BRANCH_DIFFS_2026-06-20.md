# DB / Contracts Branch Diffs — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

No branch was merged or cherry-picked.

| Branch | Migration files changed | Contract files changed | API route files changed | Schema/type files changed | Migration risk | Contract risk | Recommendation |
|---|---|---|---|---|---|---|---|
| `ai/flywheel-final-tail-closure` | `20260617120000_ai_flywheel_foundation.sql` | none | AI feedback, transcribe tests, Copilot stream, tenant AI training consent | AI feedback/flywheel types and services | P0: new tenant consent column + service-role-only AI tables | P1: route/service shape depends on new tables | `manual_review` |
| `ai/expert-review-queue-mvp` | AI Flywheel foundation, Gold Memory, Expert Review Queue migrations | none | tenant Expert Review Queue routes, AI feedback, AI training consent, Copilot stream | AI Flywheel, Expert Review Queue, Gold Memory services/types | P0: three new internal AI tables/tenant column | P1: internal admin APIs depend on schema and flags | `manual_review` |
| `ai/gold-memory-mvp` | AI Flywheel foundation, Gold Memory, Expert Review Queue migrations | `packages/contracts/package.json` build script only | tenant Expert Review Queue routes, AI feedback, AI training consent, Copilot stream | AI Flywheel, Gold Memory, Expert Review Queue services/types | P0: three new internal AI tables/tenant column | P1: broad runtime/service dependency chain | `manual_review` |
| `design/liquid-glass-public-shell-lg2a` | same three AI migrations | `packages/contracts/package.json` build script only | same AI route set as Gold Memory branch | AI Flywheel plus design/public inventories | P0: design branch carries AI migrations unexpectedly | P1: not an isolated DB/contracts source | `ignore_as_source_use_ai_branches` |
| `feature/unified-product-design-certification` | same three AI migrations | `packages/contracts/package.json` build script only | AI routes plus project/report export routes | AI Flywheel plus export/job/report notification types | P0: broad cross-module schema/API bundle | P1: contract/API deltas mixed with mobile/design | `manual_review` |
| `release/web-pilot-rc` | none | `packages/contracts/package.json` build script only | none in DB/API path filter | none | none | P2: build-command/toolchain change only | `manual_review_later_or_ignore` |
| `release/mobile-pilot-rc` | none | none | `GET /api/v1/projects/export`, `GET /api/v1/reports/export`, report review PATCH additions | export job payload, notification/reports/sync helper types | none | P1: new export/report behavior affects web/mobile clients | `manual_review` |
| `chore/phase13-operator-refresh` | none | none | legacy `/api/tenant/members` redirects to `/api/v1/tenant/members` | none | none | P0/P1: tenant API canonicalization can break legacy clients | `manual_review` |
| `feat/p0-deps-and-security-headers` | none | package-lock files under contracts packages only | security header route test | none | none | P3/P1: lockfile/package churn, no contract shape | `ignore_for_db_contracts` |
| `hotfix/middleware-matcher-and-headers` | none | none | none | none | none | none | `ignore_for_db_contracts` |
| `release/publication-readiness-mega-sprint` | 22 older product/security migrations shown as added relative to branch base, but filenames are already in main | none | legacy API route set | none | P3: already represented in main by filename | P2: stale branch API drift | `ignore_stale_compare_only_if_needed` |
| `origin/cursor/aistroyka-system-maturity-7957` | `20260307000000_fix_missing_rls_and_indexes.sql` | none | older legacy API route set | none | P0/P3: missing filename but branch is 553 behind main | P2: stale route drift | `unsafe_do_not_apply_blindly` |
| `origin/cursor/auth-and-dashboard-issues-eb7c` | `20260526090000_user_identities.sql` modified; filename exists in main | none | auth callback routes | none | P1/P3: main already has same migration filename | P1: auth route drift | `compare_to_main_if_auth_phase_requires` |

## Key Observations
- Current missing migrations worth future review are concentrated in AI Flywheel:
  - `20260617120000_ai_flywheel_foundation.sql`
  - `20260617140000_ai_gold_memory.sql`
  - `20260617160000_ai_expert_review_queue.sql`
- One older missing migration exists only in a very stale branch:
  - `20260307000000_fix_missing_rls_and_indexes.sql`
- Most older hardening migrations from `release/publication-readiness-mega-sprint` are already represented in main by filename.
- `release/mobile-pilot-rc` has no migrations but does introduce export/report API behavior that may be prerequisite for mobile or dashboard integration.
