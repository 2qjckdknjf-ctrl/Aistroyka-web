# AI Deferred Surfaces — Final Decision

**Date:** 2026-06-17  
**Owner-strict classification for every deferred surface**

---

## Edge AiActionPanel (`components/ai/AiActionPanel.tsx`)

| # | Question | Answer |
|---|----------|--------|
| 1 | Has AI output? | YES — summary / explain_risk text |
| 2 | Stable runId / recordRun? | **NO** — Edge `request_id` only |
| 3 | Original output in UI? | YES |
| 4 | Edit/correct UX? | **NO** |
| 5 | Safe preference pair now? | **NO** |
| 6 | Wire safe now? | **NO** |

**Decision:** `BLOCKED_BY_MISSING_RUN_ID` + `BLOCKED_BY_NO_EDIT_UX`

**Owner line:** Not a tail for Gold Memory — requires Edge→`recordRun` parity and optional edit UI; out of flywheel v1 scope.

---

## Intelligence brief (`CopilotSummaryPanel` + `GET .../copilot`)

| # | Question | Answer |
|---|----------|--------|
| 1 | Has AI output? | YES — brief text |
| 2 | runId / recordRun? | **NO** on GET route |
| 3 | Original output? | YES |
| 4 | Edit UX? | **NO** |
| 5 | Safe pair now? | **NO** |
| 6 | Wire safe now? | **NO** |

**Decision:** `BLOCKED_BY_MISSING_RUN_ID` + `BLOCKED_BY_NO_EDIT_UX`

**Owner line:** Not a Gold Memory blocker — add `recordRun` on GET copilot route before any wiring.

---

## Vision analysis (`MediaAnalysisRow` + analyze-image)

| # | Question | Answer |
|---|----------|--------|
| 1 | Has AI output? | YES — JSON analysis |
| 2 | runId / recordRun? | **NO** |
| 3 | Original output? | YES (read-only) |
| 4 | Edit UX? | **NO** |
| 5 | Safe pair now? | **NO** |
| 6 | Wire safe now? | **NO** |

**Decision:** `BLOCKED_BY_MISSING_RUN_ID` + `BLOCKED_BY_NO_EDIT_UX` + finance guard for estimate paths

**Owner line:** Not a Gold Memory blocker — vision flywheel is v2; finance-adjacent paths need explicit guard review first.

---

## Reports (`ReportApprovalCard`, report PATCH)

| # | Question | Answer |
|---|----------|--------|
| 1 | Has AI output? | **NO** — worker field reports |
| 2 | runId? | **NO** |
| 3 | Original AI output? | N/A |
| 4 | Edit UX? | Human `manager_note` only |

**Decision:** `NOT_AI_FEEDBACK_SURFACE`

**Owner line:** Not a tail for Gold Memory — operational approval ≠ AI preference pair.

---

## Action-plan UI (`POST /api/v1/ai/action-plan`)

| # | Question | Answer |
|---|----------|--------|
| 1 | Has AI output? | YES (API drafts) |
| 2 | runId / recordRun? | **YES** |
| 3 | Original output? | Server-side |
| 4 | Edit UX? | **NO dashboard UI** |
| 5 | Safe pair now? | **NO** (no client) |

**Decision:** `BLOCKED_BY_NO_EDIT_UX` — `OUT_OF_SCOPE_FOR_FLYWHEEL_V1`

**Owner line:** Not a Gold Memory blocker — backend ready; product UI for draft review not built.

---

## Wired in flywheel v1

| Surface | Decision |
|---------|----------|
| Web copilot stream | **WIRE_NOW** (flag-gated optional UI) |
| iOS Manager copilot | **WIRE_NOW** (flag-gated optional UI) |

---

## Summary table

| Surface | Classification |
|---------|----------------|
| Copilot stream web/iOS | WIRE_NOW ✓ |
| Edge AiActionPanel | BLOCKED_BY_MISSING_RUN_ID |
| Intelligence brief | BLOCKED_BY_MISSING_RUN_ID |
| Vision analysis | BLOCKED_BY_MISSING_RUN_ID |
| Reports | NOT_AI_FEEDBACK_SURFACE |
| Action-plan UI | BLOCKED_BY_NO_EDIT_UX / OUT_OF_SCOPE_FOR_FLYWHEEL_V1 |

**All deferred surfaces formally resolved:** YES
