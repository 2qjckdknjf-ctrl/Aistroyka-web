# ADR-0001: Canonical Project Quality Score (PQS) v1 Weights

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA Architecture (pending release council ratification)  
**Supersedes:** Informal weight tables in `ROMA_ARCHITECTURE.md` §15 and `ROMA_REPORTING_MODEL.md` §6.2

---

## Context

Stage 0 defined PQS in two documents with different domain decompositions. Release council and automation require a **single canonical weight table**.

## Decision

Adopt **PQS v1** with ten categories below. Total weight = **100**.  
`ROMA_PROJECT_QUALITY_SCORE.md` is the operational spec; this ADR is the authoritative source.

### Canonical weights

| Category ID | Category name | Weight | Maps to domain verdicts |
|-------------|---------------|--------|-------------------------|
| `CAT-FUNC` | Functional correctness | 16 | `DASHBOARD_READY`, core journey slices |
| `CAT-BCK` | Backend / API reliability | 11 | `BACKEND_READY`, `DATABASE_READY` (partial) |
| `CAT-SEC` | Security / RBAC / tenant isolation | 14 | `SECURITY_READY`, `RBAC_READY`, `TENANT_ISOLATION_READY` |
| `CAT-AI` | AI safety / reliability | 11 | `AI_READY` |
| `CAT-MOB` | Mobile readiness | 12 | `MOBILE_IOS_READY`, `MOBILE_ANDROID_READY` (split 7+5 internally) |
| `CAT-DES` | Design / responsive quality | 8 | `PUBLIC_SITE_READY` (UX/layout slices) |
| `CAT-A11Y` | Accessibility | 7 | `ACCESSIBILITY_READY` |
| `CAT-PERF` | Performance | 8 | `PERFORMANCE_READY` |
| `CAT-OBS` | Observability | 5 | `OBSERVABILITY_READY` |
| `CAT-REL` | Release readiness | 8 | `CI_READY`, `RELEASE_READY` aggregation health |
| **Total** | | **100** | |

### Mobile internal split (advisory sub-weights)

Within `CAT-MOB` (12): iOS = 7, Android = 5 — reflects iOS-primary product contour.

### Scoring rule (per category)

```
category_score:
  YES     → 1.0
  UNKNOWN → 0.3  (unknown_penalty; council may revise via ADR amendment)
  NO      → 0.0

category_points = weight × category_score
PQS = sum(category_points)  # 0–100
```

### P0 override

Any open **P0** or **R0** finding forces `RELEASE_READY = NO` regardless of PQS.

## Consequences

- Update references in architecture/reporting docs to point here (not duplicate tables).
- Stage 2+ automation reads weights from this ADR version tag `pqs_v1`.
- Weight changes require new ADR (not silent edits).

## Rationale

- **Functional + security** weighted highest — construction ops trust product.
- **Mobile** single category avoids double-counting while preserving iOS/Android sub-split.
- **Release readiness** separate from functional — CI/orchestration health distinct from UX.
