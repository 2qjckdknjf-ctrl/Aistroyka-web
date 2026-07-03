# ROMA UX Trust Hardening Report

**Date:** 2026-07-03  
**Branch:** `security/platform-admin-separation`  
**Route:** `/[locale]/platform-admin/testing`  
**Scope:** Owner/operator trust UX — read-only, no test execution, no CI triggers

## Mission

Harden the ROMA Testing dashboard so a platform owner can understand release posture in ~30 seconds without scrolling past the primary summary.

## UX Changes

### Workstream A — Owner-first summary

- Replaced scattered top cards with a single **Owner operator summary** card.
- Shows: release recommendation, confidence, readiness score (or “Score unavailable”), critical blockers, warnings, evidence coverage %, environment, last updated, next safe action.
- Visual border encoding: green (READY), amber (READY WITH WARNINGS), red (NOT READY), dashed neutral (UNKNOWN).
- No fake green when evidence is missing — UNKNOWN uses neutral badge, not success.

### Workstream B — Decision explanation

- Added **Why this decision?** section with up to 5 evidence-backed reasons.
- Each reason includes: title, component, severity, evidence, impact, recommendation, recheck condition.

### Workstream C — Business impact

- Added **Business impact by product area** grid for 10 catalog areas.
- Status: Affected / Not affected / Unknown — only “Affected” when probe evidence supports it.

### Workstream D — Data coverage & trust

- **Data coverage & trust** card with narrative explanation and blind spots list.
- Example pattern: “Coverage is 42%. ROMA can see X, but cannot see Y.”

### Workstream E — UX hygiene

- Detailed probe dashboard collapsed into `<details>` to reduce noise above the fold.
- Removed duplicate Engineering Intelligence / platform status cards.
- Read-only badge retained; no execution buttons.

## Decision Model Changes

| Rule | Before | After |
|------|--------|-------|
| Storage `not_configured` | Could imply critical failure | Information severity; release not blocked; product area = Unknown |
| Storage `unavailable` | Critical | Critical retained; language softened (“may” not “will”) |
| Low coverage + critical probe gaps | READY WITH WARNINGS possible | **UNKNOWN** release decision |
| Low coverage alone | Partial warning | **UNKNOWN** when confidence is low |
| Information-only issues | Mixed | Contribute to READY WITH WARNINGS, not READY |
| OpenAI missing | Warning | READY WITH WARNINGS; AI Copilot marked affected |
| Migration probe blocked | Warning | Information; manual review; release pipeline affected |

New intelligence outputs:

- `ownerSummary` — compact operator metrics
- `decisionReasons` — top 5 sorted by severity
- `affectedProductAreas` — 10-area catalog
- `coverageExplanation` / `coverageBlindSpots`

## Tests

### `roma-engineering-intelligence.test.ts`

- NOT READY when critical blockers exist
- READY WITH WARNINGS for non-critical OpenAI missing
- LOW confidence + UNKNOWN when coverage low with probe gaps
- Storage `not_configured` does not yield NOT READY
- Decision reasons limited to ≤5 with evidence
- Coverage explanation populated

### `roma-quality-dashboard.page.test.ts`

- Client uses owner summary, decision reasons, product areas, coverage explanation
- No execution buttons or client fetch
- No tenant `/admin/` route exposure
- Server page wires `buildRomaEngineeringIntelligence`

## Before / After Behavior

| Scenario | Before | After |
|----------|--------|-------|
| Healthy probes, 80% coverage | READY visible among many cards | READY in single summary card + next action |
| Storage probe skipped | Risk of NOT READY | UNKNOWN product area; READY WITH WARNINGS |
| OpenAI missing | Warning buried in lists | READY WITH WARNINGS + AI Copilot affected |
| 20% coverage, health/DB gaps | LOW confidence, unclear decision | UNKNOWN + LOW confidence + blind spots narrative |
| Multiple failures | NOT READY in intel block | NOT READY with red border + top 5 reasons |

## Limitations

- Readiness score comes from existing `releaseReadinessPercent`; not a new computed ROMA score.
- Product area “Tenant isolation” stays Unknown unless database or dedicated probe evidence exists.
- CI history, performance telemetry, and migration state depend on env configuration (service role, GitHub token).
- Release decision remains **advisory** — no automatic deploy/block.
- Safe Audit button not implemented in this slice (documented readiness below).

## Safe Audit Button Readiness

| Gate | Status |
|------|--------|
| Owner can read decision in <30s | YES |
| UNKNOWN distinct from PASS | YES |
| No fake green on missing evidence | YES |
| Evidence-backed product areas | YES |
| Coverage narrative explains blind spots | YES |
| Read-only, no execution surface | YES |
| Dedicated Safe Audit workflow/API | NOT IN SCOPE |

**READY_FOR_SAFE_AUDIT_BUTTON = YES** (UX/trust prerequisites met; button implementation is a separate slice)

**READY_FOR_OWNER_REVIEW = YES**

## Files Changed

- `apps/web/components/platform-admin/PlatformAdminTestingClient.tsx`
- `apps/web/lib/platform-admin/roma-engineering-intelligence.ts`
- `apps/web/lib/platform-admin/roma-engineering-intelligence.types.ts`
- `apps/web/lib/platform-admin/quality-dashboard-ui.ts`
- `apps/web/lib/platform-admin/roma-engineering-intelligence.test.ts`
- `apps/web/lib/platform-admin/roma-quality-dashboard.page.test.ts`
- `docs/audits/ROMA_UX_TRUST_HARDENING_REPORT.md`
