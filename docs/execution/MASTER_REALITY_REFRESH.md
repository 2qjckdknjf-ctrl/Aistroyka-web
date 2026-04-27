# MASTER REALITY REFRESH

## Goal

Establish current repo/live truth for Step 13, Step 12, Step 11, and B2.2 before further closure work.

## Baseline Evidence Captured

- Git branch: `hotfix/phase2-document-runtime-closure` (very large pre-existing dirty tree).
- Remote: `origin git@github.com:2qjckdknjf-ctrl/Aistroyka-web.git`.
- Build/test baseline (after closure sprint): `bun run build` = PASS, `bun run test` = PASS.
- Live DB (Supabase MCP project URL): `https://vthfrxehrursfloevnlp.supabase.co`.
- Key migrations present live: `project_documents`, `project_cost_items`, `report_approval_events`, `project_document_events`, `project_change_orders`, `project_commercial_items`.
- Runtime probes:
  - `https://staging.aistroyka.ai/api/v1/projects/<id>/costs` => `401`
  - `https://staging.aistroyka.ai/api/v1/projects/<id>/documents` => `401`
  - `https://staging.aistroyka.ai/api/v1/approvals/pending` => `404`
  - `https://aistroyka.ai/...` redirects to `https://www.aistroyka.ai/...`; final status for key Step11/12/13 routes => `401`

## Authoritative Current Status

| Area | Repo-Implemented | Repo-Validated | Live-Verified | Open Gap |
|---|---|---|---|---|
| Step 13 (cost/budget layer) | YES | YES | PARTIAL | No authenticated manager create/update flow execution from this environment |
| Step 12 (documents flow) | YES | YES | PARTIAL | No authenticated end-to-end manager create/upload/review execution from this environment |
| Step 11 (approvals semantics) | YES | YES | PARTIAL | Staging `approvals/pending` route mismatch (`404`) vs repo and production (`401`) |
| B2.2 env/config governance | PARTIAL | PARTIAL | PARTIAL | Legacy env docs still Vercel-centric while runtime path is Cloudflare-first |

## Exact Open Items

1. Authenticated manager runtime proof for Step 13 (cost create/update and manager UI loop).
2. Authenticated manager runtime proof for Step 12 (document create/upload/decision/history loop).
3. Staging deployment/runtime parity for Step 11 unified approvals queue endpoint.
4. Env/config governance truth alignment between code comments and ops docs.

## Dependency Order Confirmation

Execution order remains valid and dependency-safe:

1. Phase 0 — Baseline Truth Refresh (this file)
2. Phase 1 — Step 13 live activation closure
3. Phase 2 — Step 12 document workflow closure
4. Phase 3 — Step 11 approvals closure
5. Phase 4 — B2.2 env/config governance alignment
6. Phase 5 — final reconciliation pack

## First Execution Phase and Why

**Phase 1 (Step 13)** is first because:

- live DB/migration truth for cost layer exists and is immediately verifiable;
- cost layer is upstream to commercial/pilot readiness signal confidence;
- closing Step 13 reduces risk before Step 12/11 manager-flow closure claims.

