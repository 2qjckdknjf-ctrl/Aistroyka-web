# Pilot Governed AI Gap Audit — 2026-08-24

**Audit date:** 2026-08-24  
**Base SHA:** `3838726ab3521e19671118ef847936ee62ea5605` (`origin/main`)  
**Branch:** `feature/pilot-governed-ai-owner-evidence-2026-08-24`  
**Worktree:** `/Users/alex/Projects/AISTROYKA-pilot-governed-ai-2026-08-24` (clean)

## Repository state at audit

| Field | Value |
|-------|-------|
| Primary dirty worktree | `release/phase8-ops-2026-08-02` (unchanged; not used for implementation) |
| Implementation worktree | Clean branch from `origin/main` |
| Deployed production SHA | Not revalidated in this slice — use R0.2 truth index |
| Open PR at audit start | None for this feature |

## Already implemented (verified in code)

| Area | Status | Evidence |
|------|--------|----------|
| Daily reports + before/after upload purposes | **LIVE** | `worker_reports`, `upload_sessions.purpose`, iOS/Android worker flows |
| Manager report review | **LIVE** | `PATCH /api/v1/reports/[id]`, `report_approval_events` |
| AI Brain Phase B draft actions | **Partial** | `lib/ai-brain/phase-b/*`, `POST /api/v1/ai/action-plan` (draft-only) |
| Runtime AI governance (vision/copilot) | **LIVE** | `lib/platform/ai-governance/*`, `ai_policy_decisions` |
| Tenant audit logs | **LIVE** | `audit_logs`, `emitAudit()` |
| Stakeholder portal APIs + client UI | **Strong** | `/api/v1/portal/*`, `/dashboard/projects/[id]/client` |
| Customer finance guard | **LIVE** | `customer-finance-guard`, portal finance tests |
| Evidence intelligence signals | **Partial** | `evidence-intelligence.service.ts` (signals, not persisted chain) |
| Proof packs + traceability | **Partial** | `proof-pack.service.ts`, `traceability.repository.ts` |
| Feature flags | **LIVE** | `feature_flags`, `tenant_feature_flags` |
| Mobile contracts (worker report) | **LIVE** | `packages/contracts/src/schemas/worker.schema.ts` |

## Partially implemented

| Area | Gap |
|------|-----|
| AI action registry | Phase B drafts exist; no unified pilot registry + execution path |
| AI audit | Multi-table audit exists; no correlated `ai_action_audit_records` |
| Report completeness | Signals in intelligence services; no server evaluator API |
| Evidence chain | Media linked via join tables; no structured `visual_evidence_records` |
| Owner portal vertical slice | Client portal exists; no dedicated overview/visual-progress APIs |
| Signed URLs | Public URLs only; signed URL layer deferred |
| Prohibited AI actions | Role policy in Phase B; no centralized prohibited list enforced everywhere |

## Missing before this slice

| P0/P1 | Item |
|-------|------|
| P0 | Server-side report completeness (clients could not be blocked from claiming complete) |
| P0 | Prohibited autonomous AI actions enforced in code + tests |
| P0 | AI action audit append-only records |
| P1 | Governed pilot action registry with risk classes |
| P1 | Visual evidence metadata table (additive) |
| P1 | Owner portal overview + visual progress on real APIs |
| P1 | EU AI governance baseline doc |
| P2 | MCP/agent tool layer (ADR only — not in pilot) |
| P2 | Arabic/RTL/GCC full release |

## Documentation vs code contradictions

- Historical docs claim various readiness states; canonical index (`docs/CURRENT_PROJECT_TRUTH_INDEX.md`) supersedes — **not updated in this branch until closure**.
- "Owner portal" naming ambiguous: `OwnerViewClient` is internal contractor view; customer portal is stakeholder/client portal under `/portal` + `/client`.
- No claim of AI LIVE — remains `configured_unverified` per truth index.

## Security posture (pre-implementation)

| Control | Status |
|---------|--------|
| Tenant RLS on reports/media | Present |
| Stakeholder isolation | Present (`stakeholder_rls_*` migrations) |
| Lite worker API allow-list | Present |
| Customer finance boundary | Present |
| AI prohibited writes | **Gap** — policy draft-only but no explicit prohibited registry |
| Signed URL tenant guard | **Gap** — public URLs |

## Test posture (pre-implementation)

- Full suite on main: historically green (1546 tests per truth index)
- Portal finance negative tests: present
- Phase B policy tests: present
- Report completeness API tests: **absent**
- Governed AI executor tests: **absent**

## P0/P1/P2 gap summary

### P0 (pilot blockers addressed in this branch)
1. Governed AI prohibited action enforcement
2. Server report completeness evaluator + API
3. AI action audit append-only table
4. Owner-safe portal data slice with finance guard

### P1 (addressed in this branch)
5. Pilot action registry (9 actions)
6. Visual evidence metadata (additive migration)
7. Owner overview + visual progress APIs and UI sections
8. Governance documentation baseline

### P2 (deferred, documented)
9. Signed URL layer for stakeholder media
10. Full MCP public server
11. GCC/Arabic locale rollout
12. Remote Supabase migration apply (owner-gated)

## Closure verdict (audit phase)

**YES** — audit complete; implementation proceeded immediately on confirmed gaps.
