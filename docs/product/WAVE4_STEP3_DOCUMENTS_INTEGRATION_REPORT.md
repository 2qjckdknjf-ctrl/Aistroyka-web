# Wave 4 Step 3 — Integration report

## E1. Project detail

- Documents are reachable from the project dashboard via the **Documents** tab and deep link `?tab=documents`.
- **Pending decisions** card surfaces formal document queue count (`pendingDecisionsCount` from summary) with navigation to the documents tab.

## E2. Project summary API

- `getProjectSummary` in `project-summary.repository.ts` exposes:
  - `pendingDecisionsCount` — documents in `under_review`
  - `projectDocumentsActiveCount` — non-archived document rows for inventory signal

## E3. Attention / status derivation

- Where project attention includes `pending_decisions`, the dashboard client routes users to the documents tab (see `DashboardProjectDetailClient.tsx`).

## E4. Intentionally not touched in this step

- Worker mobile apps (beyond existing API compatibility).
- Billing, cost modules, BIM.
- Cross-project portfolio document aggregates (only if already present elsewhere; primary integration is per-project).
