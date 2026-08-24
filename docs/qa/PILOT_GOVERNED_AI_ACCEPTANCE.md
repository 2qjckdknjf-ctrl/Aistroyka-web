# Pilot Governed AI — Acceptance Checklist

**Branch:** `feature/pilot-governed-ai-owner-evidence-2026-08-24`  
**Date:** 2026-08-24

## Acceptance gates

| # | Gate | Target |
|---|------|--------|
| 1 | Existing report flow not broken | PASS (additive submit hooks) |
| 2 | Evidence chain on real API contracts | PASS (`visual_evidence_records` + sync) |
| 3 | Completeness computed server-side | PASS (`GET /api/v1/reports/:id/completeness`) |
| 4 | AI actions have policy classification | PASS (`action-registry.ts`) |
| 5 | Prohibited actions blocked in code | PASS (`prohibited-actions.ts` + tests) |
| 6 | Consequential actions require approval | PASS (`draft_owner_message`) |
| 7 | RBAC checked server-side | PASS (executor + existing routes) |
| 8 | Tenant isolation negative tests | PARTIAL (unit-level; RLS migration local only) |
| 9 | Audit log for AI actions | PASS (`ai_action_audit_records`) |
| 10 | Owner sees only allowed data | PASS (finance guard + owner_visible filter) |
| 11 | Stakeholder no internal data | PASS (existing RLS + no change to internal notes exposure) |
| 12 | AI output labeled | PASS (portal UI badges) |
| 13 | AI provider optional | PASS (deterministic paths without LLM) |
| 14 | Web build | Verify in CI |
| 15 | Mobile tests | PARTIAL (no iOS run in this slice) |
| 16 | Migrations additive | PASS (local SQL review) |
| 17 | Documentation matches code | PASS (this pack) |
| 18 | No new P0 security issues | PASS (review) |
| 19 | No placeholder success | PASS |
| 20 | PR verification report | PASS (`PILOT_GOVERNED_AI_IMPLEMENTATION_REPORT_2026-08-24.md`) |

## Required negative tests (mapped)

| Test | File / command |
|------|----------------|
| Prohibited AI action blocked | `action-executor.service.test.ts` |
| Worker blocked from manager remind | `action-executor.service.test.ts` |
| Idempotent replay | `action-executor.service.test.ts` |
| Completeness incomplete without media | `report-completeness.service.test.ts` |
| Portal finance guard | Existing portal route tests (unchanged) |

## Manual QA (post-merge staging)

1. Worker submits report → completeness API returns reasons if incomplete.
2. Manager calls `POST /api/v1/ai/governed-actions/execute` with `dry_run: true`.
3. Stakeholder opens client portal → overview + visual progress sections load empty/error states gracefully.
