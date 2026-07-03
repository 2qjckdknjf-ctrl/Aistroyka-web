# ADR-0002: PR and Release Blocking Policy

**Status:** Accepted  
**Date:** 2026-07-03  
**Deciders:** ROMA Architecture + Release Council (ratification pending)

---

## Context

ROMA must distinguish PR feedback from release gates. Stage 0 left PR blocking as "advisory by default."

## Decision

### What blocks a PR merge (via existing `ci-check.yml` + future ROMA T0)

| Gate | Blocks PR? | Owner |
|------|------------|-------|
| `bun install`, lint, typecheck, unit tests | **YES** | Existing CI |
| `cf:build` | **YES** | Existing CI |
| `release:check` policy | **YES** | Existing CI |
| ROMA T0 inventory + schema validation (Stage 1+) | **YES** when enabled | ROMA Core |
| ROMA T1 Playwright/public (Stage 2+) | **NO** (advisory comment) | ROMA WEB |
| ROMA PQS on PR | **NO** | ROMA REL |

*Rationale:* PR velocity preserved; deep QA runs nightly/staging.

### What blocks a release (staging → prod council path)

| Gate | Blocks release? | Tier |
|------|-----------------|------|
| R0 finding count > 0 | **YES** | T0+ |
| `G-STAGING-SMOKE` (pilot-smoke) | **YES** | T0 |
| `G-BUILD-STAMP` (OBS proof) | **YES** | T0 |
| `G-SECURITY-HEADERS` (prod) | **YES** | T0 |
| `G-FINANCE-ISOLATION` (prod) | **YES** | T0 |
| PQS < production threshold (70) | **YES** | T2 |
| PQS < pilot threshold (55) | **YES** for pilot expansion | T1 |
| `AI_READY = NO` when AI touched | **YES** | T2 |
| Open P0 (non-R0) | **YES** | T2 |
| Open P1 | **CONDITIONAL GO** only with council approval | T2 |

### Warning-only (never auto-block)

| Signal | Action |
|--------|--------|
| P2 findings | Backlog + Learning register |
| P3 findings | Informational |
| Coverage debt (R4) | Learning report |
| PQS regression < 5 points | Nightly alert |
| UNKNOWN domains ≤ 3 on T2 | Council brief warning |

### UNKNOWN policy

- **UNKNOWN is not approval.**
- PR: UNKNOWN domains listed in comment; do not block merge by default.
- Release: if **required** domain for target is UNKNOWN → `RELEASE_READY = UNKNOWN — INSUFFICIENT EVIDENCE` → **blocks GO**.
- Required domains for production GO: `CAT-SEC`, `CAT-BCK`, `CAT-FUNC`, `G-BUILD-STAMP`.

### Severity handling

| Severity | PR | Staging deploy | Production GO |
|----------|-----|----------------|---------------|
| P0 | Fail CI if in T0 scope | Block | Block |
| P1 | Warn | Warn; block T2 council GO | Block unless CONDITIONAL GO |
| P2 | Warn | Warn | Advisory |
| P3 | Info | Info | Info |

## Consequences

- Stage 2 adds ROMA PR comment bot (advisory).
- Release council uses `RELEASE_VERDICT.json` + this ADR for votes.

## Rationale

Aligns with AISTROYKA protected PR path (`ci-check`) while allowing ROMA depth on staging without blocking every PR.
