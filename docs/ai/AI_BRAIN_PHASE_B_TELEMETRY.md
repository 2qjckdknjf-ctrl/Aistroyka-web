# AI Brain Phase B — Telemetry

**Status:** Phase B  
**Date:** 2026-03-23

## Captured (Safe)

| Field | Source |
|-------|--------|
| request_id | getOrCreateRequestId |
| route | "POST /api/v1/ai/action-plan" |
| mode, role | Request body |
| draft_count | result.drafts.length |
| degraded | result.degraded |
| action types | From drafts (aggregate counts) |
| risk levels | From drafts |
| approval_required counts | From drafts |

## Not Logged

- Raw user request text (if any)
- Sensitive payload content

## Audit

- ai_intelligence_complete with intelligence_diagnostics.draft_count, mode, role
