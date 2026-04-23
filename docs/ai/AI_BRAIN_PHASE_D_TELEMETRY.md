# AI Brain Phase D — Telemetry

## Overview

Structured telemetry for the Eval & Learning Layer. Safe metadata only; no secrets or raw content.

## Events

| Event | Description |
|-------|-------------|
| phase_d_run_recorded | Run record created |
| phase_d_feedback_recorded | Feedback submitted |
| phase_d_eval_run_complete | Eval suite completed |
| phase_d_eval_case_skipped | Case skipped (no output) |
| phase_d_candidate_created | Improvement candidate created |

## Captured fields

- **Run recorded**: runId, tenantId, route, mode, versionRefCount
- **Feedback recorded**: feedbackId, runId, tenantId, sourceKind, feedbackCategory
- **Eval run complete**: evalRunId, totalCases, passed, failed, partial, skipped, passRate, durationMs
- **Eval case skipped**: evalRunId, caseId, reason
- **Candidate created**: candidateId, source, targetLayer, tenantId

## Implementation

- Uses `logStructured` from observability/logger
- Fire-and-forget; does not block
- Redacts secrets per logger sanitize
- Suppressed in test env
