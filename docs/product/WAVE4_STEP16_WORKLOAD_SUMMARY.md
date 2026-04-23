# Wave 4 Step 16 — Executive summary

## What shipped

- **Domain:** `apps/web/lib/domain/workload/` — types, governance helpers, `buildManagerWorkload`, `buildStakeholderWorkload`, `buildLeadershipWorkload`.
- **API:** `GET /api/v1/workload?audience=manager|stakeholder|leadership`.
- **Manager UI:** `/dashboard/workload` + sidebar nav.
- **Stakeholder UI:** `ClientPortalWorkloadSection` — “Waiting on you” filtered to current project.
- **Docs:** nine `WAVE4_STEP16_*` files under `docs/product/`.

## What this is

Operational **read model** answering “what needs attention for my role?” with links into existing surfaces — not a task database or messaging product.

## Honest gaps (next iteration)

- Change orders as workload sources when a single summary signal exists.
- Richer tests around `workload.service` and stakeholder error UX.
- Finer stakeholder prioritization.
