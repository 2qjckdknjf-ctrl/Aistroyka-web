# Phase 3 — Runtime Matrix (Staging)

**Date:** 2026-04-18  
**Environment:** `https://staging.aistroyka.ai`  
**Actor context:** authenticated tenant user (`admin` manager path).

## Goal

Validate live budget/cost activation loop:

1. Cost lifecycle with summary/signal output.
2. Change-order lifecycle with transitions.
3. Commercial lifecycle linked to change-order.

## Runtime results

### Flow A — Costs (`create -> update -> over-budget summary`)

- **PASS**
- Evidence:
  - cost item: `4d121d33-9c00-4530-afff-610cf844d441`
  - endpoint: `POST /api/v1/projects/{id}/costs` -> `201`
  - transitions:
    - `planned` (`actual=0`)
    - `incurred` (`actual=98000`)
    - `approved` (`actual=130000`)
  - summary endpoint now includes enrichment fields:
    - `utilization_ratio`
    - `nearing_budget_limit`
    - `item_overrun_count`
    - `signals[]`
  - over-budget signal observed:
    - `project_over_budget` (critical)

### Flow B — Change orders (`create -> edit -> transition -> approved`)

- **PASS**
- Evidence:
  - change order: `45cd4043-9bee-4123-aef1-79bc35908d14`
  - endpoints:
    - `POST /api/v1/projects/{id}/change-orders` -> `200`
    - `PATCH /api/v1/projects/{id}/change-orders/{id}` -> `200`
    - `POST /api/v1/projects/{id}/change-orders/{id}/transition` -> `200`
  - transitions observed:
    - `draft -> proposed -> under_review -> approved`
  - detail endpoint returns event history (`events.length = 3`).

### Flow C — Commercial items (`create linked -> issued -> due -> paid`)

- **PASS**
- Evidence:
  - commercial item: `f8691e5e-a97c-4080-8236-9aa2be00f388`
  - linked change-order id: `45cd4043-9bee-4123-aef1-79bc35908d14`
  - endpoints:
    - `POST /api/v1/projects/{id}/commercial-items` -> `201`
    - `PATCH /api/v1/projects/{id}/commercial-items/{id}` transitions -> `200`
  - transitions observed:
    - `draft -> issued -> due -> paid`
  - `paid_at` populated on final state.

## Deployment evidence

- Staging deploy run for this slice:
  - [GitHub Actions run 24603161321](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24603161321)
  - `Build and deploy to staging` job: **success**
  - post-deploy pilot smoke job failed on unrelated tokenized metrics probe (`ops/metrics` auth context), not on Phase 3 APIs.

## Runtime verdict

- **PASS (manager activation path)** for Phase 3 budget/cost scope.
