# ADR-0006: docs/roma vs docs/qa Relationship

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA Architecture

---

## Context

A prior exploratory QA platform created `docs/qa/` (inventory, reports, artifacts) outside ROMA governance. Stage 0 review required a clear ownership boundary before Stage 2 implementation.

## Decision

### Division of responsibility

| Path | Purpose | Content type | Version control |
|------|---------|--------------|-----------------|
| `docs/roma/` | **Architecture & governance** | Specs, ADRs, roadmap, merge tracker, Core spec, schemas (future) | Committed intentionally; PR-reviewed |
| `docs/qa/` | **Generated execution output** | Run reports, coverage snapshots, Playwright artifacts, verdict JSON from runs | Generated; commit only when council wants audit trail snapshots |

### Reference rules

- `docs/roma/*` **defines** what ROMA measures and how verdicts are computed.
- `docs/qa/*` **records** what happened in a specific run (`run_id`).
- ROMA Core writes to `docs/qa/runs/{run_id}/` (future); never writes ADRs to `docs/qa/`.
- `docs/qa/` documents may link up to `docs/roma/ROMA_PROJECT_QUALITY_SCORE.md` and ADRs — not duplicate them.

### No duplication rule

| Content | Canonical location |
|---------|-------------------|
| PQS weights | `docs/roma/adr/ADR-0001-*` |
| PR blocking policy | `docs/roma/adr/ADR-0002-*` |
| Credential profiles | `docs/roma/adr/ADR-0003-*` |
| Release verdict from run X | `docs/qa/runs/{run_id}/RELEASE_VERDICT.json` |
| Coverage report from run X | `docs/qa/runs/{run_id}/COVERAGE_REPORT.md` |
| System inventory snapshot | `docs/roma/inventory/` (baseline) + run delta in `docs/qa/` |

### Transitional assets (pre-ROMA implementation)

Existing `docs/qa/` content from exploratory work is **non-canonical** until re-emitted by ROMA Core adapters (Stage 1–2). Stage 2 will:

1. Point adapters at `docs/qa/runs/` layout per ROMA artifact policy.
2. Deprecate ad-hoc root-level `docs/qa/reports/` after first official T0 run.
3. Not delete historical files without owner approval.

### Cross-links

- `ROMA_CORE_SPEC.md` §Artifact policy references this ADR.
- Generated reports include header: `governance_ref: docs/roma/adr/ADR-0001`.

## Consequences

- Stage 1 does not commit changes to `docs/qa/`.
- Stage 2 implementation migrates output paths; no architecture duplication in `docs/qa/`.

## Rationale

Separates durable governance (roma) from ephemeral evidence (qa) — supports years of runs without polluting architecture docs.
