# Wave 4 Step 20 — Integration report (Stage E)

## E1 — Portfolio / command view

**`GET /api/v1/portfolio/summary`** (`apps/web/app/api/v1/portfolio/summary/route.ts`)

- Calls `countOpenGovernanceCases(supabase, tenantId)` early in the handler.
- Response includes `governanceOpenCount` and `governanceCriticalOpenCount`.

**`PortfolioCommandViewClient.tsx`**

- When `governanceOpenCount > 0`, shows an alert banner with counts and link to `/dashboard/governance`.

## E2 — Executive review pack

**`portfolio-review-pack.service.ts`** + **`review-packs.types.ts`**

- Adds `governanceEscalations: { openCount, criticalOpenCount }` to the pack shape.
- **`PortfolioReviewPackSection.tsx`** renders a line when `openCount > 0` with link “Open governance”.

## E3 — Leadership workload

**`workload.service.ts`** + **`workload.types.ts`**

- New workload kind: **`governance_escalation`**.
- `buildLeadershipWorkload` loads active governance cases via `listGovernanceCases` filtered by `ACTIVE_STATUSES` and emits items with `action_url: /dashboard/governance`.

## Intentionally not built

- **No** new analytics warehouse or parallel metrics layer.
- **No** automatic case creation from portfolio rows (integration is **signal + navigation**, not auto-ticketing).
- **No** changes to Android apps in this step.

## Project detail page

Existing “Workload & governance” panel on project detail remains contextual; cross-project cases are **listed under governance**, not duplicated as full duplicate UIs per project in Step 20.
