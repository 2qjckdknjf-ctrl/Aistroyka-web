# API Final Drift Posture Report

## Goal

Finalize API v1 vs legacy posture for publication readiness and isolate remaining drift as explicit backlog.

## Current posture

### Canonical

- `/api/v1/*` remains canonical for product surfaces.
- Critical publication routes touched in this sprint stayed in v1 and received focused test reinforcement:
  - worker submit
  - manager review transition
  - documents list/upload
  - costs item route
  - devices register/unregister
  - copilot non-stream route
  - system health guard tests

### Legacy compatibility

- Legacy `/api/*` handlers still exist for selected bridges (for example health and some AI paths).
- Legacy removal is intentionally deferred to avoid release-risk regressions.

### Internal/system

- `/api/system/*` and `/api/v1/system/*` retain guarded access model (deny-path verified live).

## High-risk publication blockers check

1. Auth/tenant leak from changed critical routes: no new evidence of leak in current stage.
2. Worker/docs/cost/review envelope break in touched routes: mitigated by added targeted tests.
3. Broken client call path from changed endpoints: not observed in gate/test evidence.

## Final classification

- **Publication-time posture:** ACCEPTABLE_WITH_CONTROLLED_LEGACY
- **No mass migration performed** (by design for risk control).
- Remaining drift moved to backlog:
  - `docs/publication-readiness/API_LEGACY_DRIFT_BACKLOG.md`

## Verdict

**CLOSED for final release posture; backlog remains P2**

